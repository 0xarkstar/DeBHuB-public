// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IProgrammableData.sol";

/**
 * @title AccessControl
 * @notice Decentralized access control for documents and resources
 * @dev Replaces PostgreSQL role-based permissions with on-chain smart contract logic
 *
 * Permission Levels:
 * 0 = NONE    - No access
 * 1 = READ    - Can read document
 * 2 = WRITE   - Can edit document
 * 3 = ADMIN   - Can manage permissions
 * 4 = OWNER   - Full control
 */
contract AccessControl is ProgrammableDataBase {
    // ==================== Types ====================

    enum Permission {
        NONE,    // 0
        READ,    // 1
        WRITE,   // 2
        ADMIN,   // 3
        OWNER    // 4
    }

    // ==================== State Variables ====================

    // Resource owner mapping
    mapping(bytes32 => address) public owners;

    // Permission mapping: resourceId => user => permission level
    mapping(bytes32 => mapping(address => Permission)) public permissions;

    // Public resources (anyone can read)
    mapping(bytes32 => bool) public isPublic;

    // Collaborator lists for enumeration
    mapping(bytes32 => address[]) private collaborators;
    mapping(bytes32 => mapping(address => uint256)) private collaboratorIndex;

    // Permission groups (for batch permissions)
    mapping(bytes32 => bytes32) public resourceGroups;
    mapping(bytes32 => mapping(address => Permission)) public groupPermissions;

    // ==================== Events ====================

    event OwnershipTransferred(
        bytes32 indexed resourceId,
        address indexed previousOwner,
        address indexed newOwner
    );

    event PermissionGranted(
        bytes32 indexed resourceId,
        address indexed user,
        Permission permission
    );

    event PermissionRevoked(
        bytes32 indexed resourceId,
        address indexed user
    );

    event PublicStatusChanged(
        bytes32 indexed resourceId,
        bool isPublic
    );

    event ResourceAccessed(
        bytes32 indexed resourceId,
        address indexed user,
        Permission requiredPermission
    );

    // ==================== Modifiers ====================

    modifier onlyOwner(bytes32 resourceId) {
        require(owners[resourceId] == msg.sender, "Not resource owner");
        _;
    }

    modifier hasPermission(bytes32 resourceId, Permission required) {
        require(
            checkPermission(resourceId, msg.sender, required),
            "Insufficient permission"
        );
        _;
    }

    // ==================== Core Functions ====================

    /**
     * @notice Initialize a new resource with owner
     * @param resourceId Unique resource identifier
     */
    function initializeResource(bytes32 resourceId) external {
        require(owners[resourceId] == address(0), "Resource already initialized");
        owners[resourceId] = msg.sender;
        permissions[resourceId][msg.sender] = Permission.OWNER;

        emit OwnershipTransferred(resourceId, address(0), msg.sender);
    }

    /**
     * @notice Transfer ownership of a resource
     * @param resourceId Resource ID
     * @param newOwner New owner address
     */
    function transferOwnership(bytes32 resourceId, address newOwner)
        external
        onlyOwner(resourceId)
    {
        require(newOwner != address(0), "Invalid new owner");

        address previousOwner = owners[resourceId];

        // Update owner
        owners[resourceId] = newOwner;

        // Update permissions
        permissions[resourceId][previousOwner] = Permission.ADMIN;
        permissions[resourceId][newOwner] = Permission.OWNER;

        emit OwnershipTransferred(resourceId, previousOwner, newOwner);
    }

    /**
     * @notice Grant permission to a user
     * @param resourceId Resource ID
     * @param user User address
     * @param permission Permission level to grant
     */
    function grantPermission(
        bytes32 resourceId,
        address user,
        Permission permission
    ) external hasPermission(resourceId, Permission.ADMIN) {
        require(user != address(0), "Invalid user address");
        require(permission != Permission.OWNER, "Cannot grant OWNER permission");
        require(permission != Permission.NONE, "Use revokePermission instead");

        // Only owner can grant ADMIN
        if (permission == Permission.ADMIN) {
            require(owners[resourceId] == msg.sender, "Only owner can grant ADMIN");
        }

        // Add to collaborators list if new
        if (permissions[resourceId][user] == Permission.NONE) {
            collaborators[resourceId].push(user);
            collaboratorIndex[resourceId][user] = collaborators[resourceId].length - 1;
        }

        permissions[resourceId][user] = permission;

        emit PermissionGranted(resourceId, user, permission);
    }

    /**
     * @notice Revoke permission from a user
     * @param resourceId Resource ID
     * @param user User address
     */
    function revokePermission(bytes32 resourceId, address user)
        external
        hasPermission(resourceId, Permission.ADMIN)
    {
        require(user != address(0), "Invalid user address");
        require(user != owners[resourceId], "Cannot revoke owner permission");

        Permission currentPermission = permissions[resourceId][user];
        require(currentPermission != Permission.NONE, "User has no permission");

        // Only owner can revoke ADMIN
        if (currentPermission == Permission.ADMIN) {
            require(owners[resourceId] == msg.sender, "Only owner can revoke ADMIN");
        }

        // Remove from collaborators list
        uint256 index = collaboratorIndex[resourceId][user];
        uint256 lastIndex = collaborators[resourceId].length - 1;

        if (index != lastIndex) {
            address lastUser = collaborators[resourceId][lastIndex];
            collaborators[resourceId][index] = lastUser;
            collaboratorIndex[resourceId][lastUser] = index;
        }

        collaborators[resourceId].pop();
        delete collaboratorIndex[resourceId][user];
        delete permissions[resourceId][user];

        emit PermissionRevoked(resourceId, user);
    }

    /**
     * @notice Set public visibility of a resource
     * @param resourceId Resource ID
     * @param _isPublic Whether resource is public
     */
    function setPublic(bytes32 resourceId, bool _isPublic)
        external
        onlyOwner(resourceId)
    {
        isPublic[resourceId] = _isPublic;
        emit PublicStatusChanged(resourceId, _isPublic);
    }

    /**
     * @notice Batch grant permissions to multiple users
     * @param resourceId Resource ID
     * @param users Array of user addresses
     * @param permission Permission level
     */
    function batchGrantPermission(
        bytes32 resourceId,
        address[] calldata users,
        Permission permission
    ) external hasPermission(resourceId, Permission.ADMIN) {
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && permissions[resourceId][users[i]] == Permission.NONE) {
                permissions[resourceId][users[i]] = permission;
                collaborators[resourceId].push(users[i]);
                collaboratorIndex[resourceId][users[i]] = collaborators[resourceId].length - 1;
                emit PermissionGranted(resourceId, users[i], permission);
            }
        }
    }

    // ==================== Check Functions ====================

    /**
     * @notice Check if user has required permission
     * @param resourceId Resource ID
     * @param user User address
     * @param required Required permission level
     * @return bool Whether user has permission
     */
    function checkPermission(
        bytes32 resourceId,
        address user,
        Permission required
    ) public view returns (bool) {
        // Owner always has access
        if (owners[resourceId] == user) {
            return true;
        }

        // Public resources allow READ
        if (required == Permission.READ && isPublic[resourceId]) {
            return true;
        }

        // Check user's permission level
        Permission userPermission = permissions[resourceId][user];

        // Permission hierarchy: OWNER > ADMIN > WRITE > READ > NONE
        return userPermission >= required;
    }

    /**
     * @notice Check if user can read resource
     * @param resourceId Resource ID
     * @param user User address
     * @return bool Whether user can read
     */
    function canRead(bytes32 resourceId, address user)
        external
        view
        returns (bool)
    {
        return checkPermission(resourceId, user, Permission.READ);
    }

    /**
     * @notice Check if user can write to resource
     * @param resourceId Resource ID
     * @param user User address
     * @return bool Whether user can write
     */
    function canWrite(bytes32 resourceId, address user)
        external
        view
        returns (bool)
    {
        return checkPermission(resourceId, user, Permission.WRITE);
    }

    /**
     * @notice Check if user is admin of resource
     * @param resourceId Resource ID
     * @param user User address
     * @return bool Whether user is admin
     */
    function isAdmin(bytes32 resourceId, address user)
        external
        view
        returns (bool)
    {
        return checkPermission(resourceId, user, Permission.ADMIN);
    }

    /**
     * @notice Check if user is owner of resource
     * @param resourceId Resource ID
     * @param user User address
     * @return bool Whether user is owner
     */
    function isOwner(bytes32 resourceId, address user)
        external
        view
        returns (bool)
    {
        return owners[resourceId] == user;
    }

    // ==================== Query Functions ====================

    /**
     * @notice Get user's permission level
     * @param resourceId Resource ID
     * @param user User address
     * @return Permission level
     */
    function getPermission(bytes32 resourceId, address user)
        external
        view
        returns (Permission)
    {
        if (owners[resourceId] == user) {
            return Permission.OWNER;
        }
        return permissions[resourceId][user];
    }

    /**
     * @notice Get all collaborators of a resource
     * @param resourceId Resource ID
     * @return Array of collaborator addresses
     */
    function getCollaborators(bytes32 resourceId)
        external
        view
        returns (address[] memory)
    {
        return collaborators[resourceId];
    }

    /**
     * @notice Get number of collaborators
     * @param resourceId Resource ID
     * @return Number of collaborators
     */
    function getCollaboratorCount(bytes32 resourceId)
        external
        view
        returns (uint256)
    {
        return collaborators[resourceId].length;
    }

    /**
     * @notice Get owner of resource
     * @param resourceId Resource ID
     * @return Owner address
     */
    function getOwner(bytes32 resourceId)
        external
        view
        returns (address)
    {
        return owners[resourceId];
    }

    // ==================== Programmable Data Integration ====================

    /**
     * @notice Read document data with access control
     * @param resourceId Resource ID (document)
     * @return Data bytes
     */
    function readDocumentData(bytes32 resourceId)
        external
        hasPermission(resourceId, Permission.READ)
        returns (bytes memory)
    {
        (bool success, bytes memory data) = readBytes();
        require(success, "Reading document failed");

        emit ResourceAccessed(resourceId, msg.sender, Permission.READ);

        return data;
    }

    /**
     * @notice Read document data with offset
     * @param resourceId Resource ID
     * @param offset Starting position
     * @param length Number of bytes to read
     * @return Data bytes
     */
    function readDocumentDataWithOffset(
        bytes32 resourceId,
        uint256 offset,
        uint256 length
    )
        external
        hasPermission(resourceId, Permission.READ)
        returns (bytes memory)
    {
        (bool success, bytes memory data) = readBytes(offset, length);
        require(success, "Reading document failed");

        emit ResourceAccessed(resourceId, msg.sender, Permission.READ);

        return data;
    }

    // ==================== Group Permissions (Advanced) ====================

    /**
     * @notice Create a permission group
     * @param groupId Group identifier
     * @param resourceId Resource to associate with group
     */
    function createGroup(bytes32 groupId, bytes32 resourceId)
        external
        onlyOwner(resourceId)
    {
        require(resourceGroups[resourceId] == bytes32(0), "Resource already in group");
        resourceGroups[resourceId] = groupId;
    }

    /**
     * @notice Grant group permission
     * @param groupId Group ID
     * @param user User address
     * @param permission Permission level
     */
    function grantGroupPermission(
        bytes32 groupId,
        address user,
        Permission permission
    ) external {
        groupPermissions[groupId][user] = permission;
    }
}
