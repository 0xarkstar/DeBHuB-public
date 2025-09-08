// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IrysBaseCore
 * @dev Smart contract for programmable data management with Irys integration
 */
contract IrysBaseCore is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Document metadata structure
    struct Document {
        bytes32 id;
        address owner;
        bytes32 irysId;
        uint256 version;
        bytes metadata;
        uint256 timestamp;
        bool exists;
    }
    
    // Access control rules
    struct AccessRule {
        bool isPublic;
        uint256 expiryTime;
        mapping(address => uint8) permissions; // 0: none, 1: read, 2: write, 3: admin
    }
    
    // Programmable trigger structure
    struct ProgrammableTrigger {
        string eventType; // 'onAccess', 'onUpdate', 'onView'
        string condition;
        string action;
        bool enabled;
        uint256 executionCount;
        uint256 lastExecuted;
    }
    
    // State variables
    mapping(bytes32 => Document) public documents;
    mapping(bytes32 => AccessRule) public accessRules;
    mapping(bytes32 => bytes) public storedData;
    mapping(bytes32 => ProgrammableTrigger[]) public documentTriggers;
    mapping(bytes32 => mapping(address => uint256)) public accessLog;
    
    Counters.Counter private _documentCounter;
    
    // Events
    event DocumentCreated(bytes32 indexed id, address indexed owner, bytes32 irysId);
    event DocumentUpdated(bytes32 indexed id, uint256 version, bytes32 newIrysId);
    event DataStored(bytes32 indexed documentId, uint256 size);
    event AccessGranted(bytes32 indexed documentId, address indexed user, uint8 permission);
    event AccessRevoked(bytes32 indexed documentId, address indexed user);
    event TriggerExecuted(bytes32 indexed documentId, string triggerType, uint256 timestamp);
    event ProgrammableRuleAdded(bytes32 indexed documentId, string eventType, string action);
    
    // Modifiers
    modifier documentExists(bytes32 documentId) {
        require(documents[documentId].exists, "Document does not exist");
        _;
    }
    
    modifier hasPermission(bytes32 documentId, uint8 requiredLevel) {
        require(_hasPermission(documentId, msg.sender, requiredLevel), "Insufficient permissions");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Creates a new document with Irys integration
     */
    function createDocument(
        bytes32 documentId,
        bytes32 irysTransactionId,
        bytes calldata metadata
    ) external nonReentrant {
        require(!documents[documentId].exists, "Document already exists");
        require(irysTransactionId != bytes32(0), "Invalid Irys transaction ID");
        
        _documentCounter.increment();
        
        documents[documentId] = Document({
            id: documentId,
            owner: msg.sender,
            irysId: irysTransactionId,
            version: 1,
            metadata: metadata,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Set default access rules
        AccessRule storage rule = accessRules[documentId];
        rule.isPublic = false;
        rule.expiryTime = 0;
        rule.permissions[msg.sender] = 3; // Admin access for owner
        
        emit DocumentCreated(documentId, msg.sender, irysTransactionId);
    }
    
    /**
     * @dev Stores document data (simulating programmable data read)
     */
    function storeDocumentData(
        bytes32 documentId,
        bytes32 irysTransactionId,
        uint256 startOffset,
        uint256 length,
        bytes calldata data
    ) external nonReentrant hasPermission(documentId, 2) documentExists(documentId) {
        // In a real implementation, this would use Irys precompile to read data
        // For now, we'll store the provided data directly
        storedData[documentId] = data;
        documents[documentId].irysId = irysTransactionId;
        documents[documentId].timestamp = block.timestamp;
        
        // Execute any access triggers
        _executeTriggers(documentId, "onUpdate");
        
        emit DataStored(documentId, data.length);
    }
    
    /**
     * @dev Updates document version with new Irys transaction
     */
    function updateDocument(
        bytes32 documentId,
        bytes32 newIrysId,
        bytes calldata metadata
    ) external nonReentrant hasPermission(documentId, 2) documentExists(documentId) {
        Document storage doc = documents[documentId];
        doc.version++;
        doc.irysId = newIrysId;
        doc.metadata = metadata;
        doc.timestamp = block.timestamp;
        
        _executeTriggers(documentId, "onUpdate");
        
        emit DocumentUpdated(documentId, doc.version, newIrysId);
    }
    
    /**
     * @dev Adds a programmable rule to a document
     */
    function addProgrammableRule(
        bytes32 documentId,
        string calldata eventType,
        string calldata condition,
        string calldata action
    ) external hasPermission(documentId, 3) documentExists(documentId) {
        documentTriggers[documentId].push(ProgrammableTrigger({
            eventType: eventType,
            condition: condition,
            action: action,
            enabled: true,
            executionCount: 0,
            lastExecuted: 0
        }));
        
        emit ProgrammableRuleAdded(documentId, eventType, action);
    }
    
    /**
     * @dev Grants access permission to a user
     */
    function grantAccess(
        bytes32 documentId,
        address user,
        uint8 permissionLevel
    ) external hasPermission(documentId, 3) documentExists(documentId) {
        require(permissionLevel <= 3, "Invalid permission level");
        
        accessRules[documentId].permissions[user] = permissionLevel;
        
        emit AccessGranted(documentId, user, permissionLevel);
    }
    
    /**
     * @dev Revokes access permission from a user
     */
    function revokeAccess(
        bytes32 documentId,
        address user
    ) external hasPermission(documentId, 3) documentExists(documentId) {
        accessRules[documentId].permissions[user] = 0;
        
        emit AccessRevoked(documentId, user);
    }
    
    /**
     * @dev Sets document as public or private
     */
    function setPublicAccess(
        bytes32 documentId,
        bool isPublic
    ) external hasPermission(documentId, 3) documentExists(documentId) {
        accessRules[documentId].isPublic = isPublic;
    }
    
    /**
     * @dev Records access to a document (for analytics)
     */
    function recordAccess(bytes32 documentId) 
        external 
        hasPermission(documentId, 1) 
        documentExists(documentId) 
    {
        accessLog[documentId][msg.sender] = block.timestamp;
        _executeTriggers(documentId, "onAccess");
    }
    
    /**
     * @dev Executes conditional action (programmable trigger)
     */
    function executeConditionalAction(
        bytes32 documentId,
        uint256 triggerIndex
    ) external hasPermission(documentId, 1) documentExists(documentId) {
        require(triggerIndex < documentTriggers[documentId].length, "Invalid trigger index");
        
        ProgrammableTrigger storage trigger = documentTriggers[documentId][triggerIndex];
        require(trigger.enabled, "Trigger is disabled");
        
        // In a real implementation, this would evaluate the condition
        // For now, we'll just execute the action
        trigger.executionCount++;
        trigger.lastExecuted = block.timestamp;
        
        emit TriggerExecuted(documentId, trigger.eventType, block.timestamp);
    }
    
    // View functions
    function getDocument(bytes32 documentId) 
        external 
        view 
        hasPermission(documentId, 1) 
        returns (Document memory) 
    {
        return documents[documentId];
    }
    
    function getDocumentData(bytes32 documentId) 
        external 
        view 
        hasPermission(documentId, 1) 
        returns (bytes memory) 
    {
        return storedData[documentId];
    }
    
    function getDocumentTriggers(bytes32 documentId) 
        external 
        view 
        hasPermission(documentId, 1) 
        returns (ProgrammableTrigger[] memory) 
    {
        return documentTriggers[documentId];
    }
    
    function getUserPermission(bytes32 documentId, address user) 
        external 
        view 
        returns (uint8) 
    {
        return _getUserPermission(documentId, user);
    }
    
    function getTotalDocuments() external view returns (uint256) {
        return _documentCounter.current();
    }
    
    // Internal functions
    function _hasPermission(
        bytes32 documentId,
        address user,
        uint8 requiredLevel
    ) internal view returns (bool) {
        // Owner has all permissions
        if (documents[documentId].owner == user) return true;
        
        AccessRule storage rule = accessRules[documentId];
        
        // Check expiry
        if (rule.expiryTime > 0 && block.timestamp > rule.expiryTime) {
            return false;
        }
        
        // Public read access
        if (rule.isPublic && requiredLevel == 1) return true;
        
        // Explicit permissions
        return rule.permissions[user] >= requiredLevel;
    }
    
    function _getUserPermission(bytes32 documentId, address user) internal view returns (uint8) {
        if (documents[documentId].owner == user) return 3;
        
        AccessRule storage rule = accessRules[documentId];
        
        if (rule.expiryTime > 0 && block.timestamp > rule.expiryTime) {
            return 0;
        }
        
        uint8 explicitPermission = rule.permissions[user];
        if (rule.isPublic && explicitPermission == 0) {
            return 1; // Public read access
        }
        
        return explicitPermission;
    }
    
    function _executeTriggers(bytes32 documentId, string memory eventType) internal {
        ProgrammableTrigger[] storage triggers = documentTriggers[documentId];
        
        for (uint256 i = 0; i < triggers.length; i++) {
            ProgrammableTrigger storage trigger = triggers[i];
            
            if (trigger.enabled && 
                keccak256(bytes(trigger.eventType)) == keccak256(bytes(eventType))) {
                
                // Simple condition evaluation (in real implementation, this would be more sophisticated)
                bool conditionMet = bytes(trigger.condition).length == 0 || _evaluateCondition(trigger.condition);
                
                if (conditionMet) {
                    trigger.executionCount++;
                    trigger.lastExecuted = block.timestamp;
                    
                    emit TriggerExecuted(documentId, trigger.eventType, block.timestamp);
                }
            }
        }
    }
    
    function _evaluateCondition(string memory condition) internal pure returns (bool) {
        // Simplified condition evaluation
        // In a real implementation, this would parse and evaluate complex conditions
        return true;
    }
}