// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProvenanceChain
 * @notice Immutable version history and provenance tracking
 * @dev Replaces PostgreSQL versioning tables with on-chain immutable records
 *
 * Every modification is recorded permanently, creating an unbreakable audit trail.
 * This provides:
 * - Complete version history
 * - Author attribution
 * - Timestamp verification
 * - AI-generated content tracking
 */
contract ProvenanceChain {
    // ==================== Types ====================

    struct Version {
        bytes32 irysId;              // Irys transaction ID for this version
        address author;              // Version author
        uint256 timestamp;           // Creation timestamp
        bytes32 previousVersion;     // Previous version ID (chain link)
        string changeDescription;    // Description of changes
        bool aiGenerated;            // Whether content was AI-generated
        string aiModel;              // AI model used (if applicable)
    }

    struct ProvenanceRecord {
        address originalAuthor;      // Original creator
        uint256 createdAt;           // Initial creation time
        uint256 versionCount;        // Total number of versions
        bytes32 latestVersion;       // Most recent version ID
        bool isLocked;               // Whether provenance is locked
    }

    // ==================== State Variables ====================

    // Entity ID => Provenance Record
    mapping(bytes32 => ProvenanceRecord) public provenance;

    // Entity ID => Version array
    mapping(bytes32 => Version[]) private versionHistory;

    // Version ID => Version data (for direct lookup)
    mapping(bytes32 => Version) public versions;

    // Entity ID => Version number => Version ID
    mapping(bytes32 => mapping(uint256 => bytes32)) public versionByNumber;

    // Statistics
    uint256 public totalEntities;
    uint256 public totalVersions;

    // ==================== Events ====================

    event ProvenanceRecorded(
        bytes32 indexed entityId,
        address indexed originalAuthor,
        bytes32 firstVersionId,
        bool aiGenerated
    );

    event VersionAdded(
        bytes32 indexed entityId,
        bytes32 indexed versionId,
        uint256 versionNumber,
        address indexed author
    );

    event ProvenanceLocked(
        bytes32 indexed entityId,
        uint256 finalVersionCount
    );

    // ==================== Modifiers ====================

    modifier notLocked(bytes32 entityId) {
        require(!provenance[entityId].isLocked, "Provenance is locked");
        _;
    }

    modifier entityExists(bytes32 entityId) {
        require(provenance[entityId].createdAt != 0, "Entity does not exist");
        _;
    }

    // ==================== Core Functions ====================

    /**
     * @notice Record initial provenance for a new entity
     * @param entityId Unique entity identifier
     * @param firstVersionId First version Irys ID
     * @param aiGenerated Whether content was AI-generated
     * @param aiModel AI model name (if applicable)
     * @param description Initial description
     */
    function recordProvenance(
        bytes32 entityId,
        bytes32 firstVersionId,
        bool aiGenerated,
        string memory aiModel,
        string memory description
    ) external returns (bytes32) {
        require(provenance[entityId].createdAt == 0, "Provenance already exists");
        require(firstVersionId != bytes32(0), "Invalid version ID");

        // Create provenance record
        provenance[entityId] = ProvenanceRecord({
            originalAuthor: msg.sender,
            createdAt: block.timestamp,
            versionCount: 1,
            latestVersion: firstVersionId,
            isLocked: false
        });

        // Create first version
        Version memory firstVersion = Version({
            irysId: firstVersionId,
            author: msg.sender,
            timestamp: block.timestamp,
            previousVersion: bytes32(0),
            changeDescription: description,
            aiGenerated: aiGenerated,
            aiModel: aiModel
        });

        versionHistory[entityId].push(firstVersion);
        versions[firstVersionId] = firstVersion;
        versionByNumber[entityId][0] = firstVersionId;

        totalEntities++;
        totalVersions++;

        emit ProvenanceRecorded(entityId, msg.sender, firstVersionId, aiGenerated);
        emit VersionAdded(entityId, firstVersionId, 0, msg.sender);

        return firstVersionId;
    }

    /**
     * @notice Add a new version to the provenance chain
     * @param entityId Entity identifier
     * @param newVersionId New version Irys ID
     * @param description Description of changes
     * @param aiGenerated Whether this version was AI-generated
     * @param aiModel AI model used (if applicable)
     */
    function addVersion(
        bytes32 entityId,
        bytes32 newVersionId,
        string memory description,
        bool aiGenerated,
        string memory aiModel
    ) external entityExists(entityId) notLocked(entityId) returns (uint256) {
        require(newVersionId != bytes32(0), "Invalid version ID");

        ProvenanceRecord storage record = provenance[entityId];
        bytes32 previousVersionId = record.latestVersion;
        uint256 versionNumber = record.versionCount;

        // Create new version
        Version memory newVersion = Version({
            irysId: newVersionId,
            author: msg.sender,
            timestamp: block.timestamp,
            previousVersion: previousVersionId,
            changeDescription: description,
            aiGenerated: aiGenerated,
            aiModel: aiModel
        });

        versionHistory[entityId].push(newVersion);
        versions[newVersionId] = newVersion;
        versionByNumber[entityId][versionNumber] = newVersionId;

        // Update provenance
        record.latestVersion = newVersionId;
        record.versionCount++;

        totalVersions++;

        emit VersionAdded(entityId, newVersionId, versionNumber, msg.sender);

        return versionNumber;
    }

    /**
     * @notice Lock provenance to prevent further modifications
     * @param entityId Entity identifier
     */
    function lockProvenance(bytes32 entityId)
        external
        entityExists(entityId)
        notLocked(entityId)
    {
        ProvenanceRecord storage record = provenance[entityId];
        require(record.originalAuthor == msg.sender, "Only original author can lock");

        record.isLocked = true;

        emit ProvenanceLocked(entityId, record.versionCount);
    }

    // ==================== Query Functions ====================

    /**
     * @notice Get provenance record for an entity
     * @param entityId Entity identifier
     * @return Provenance record
     */
    function getProvenance(bytes32 entityId)
        external
        view
        entityExists(entityId)
        returns (ProvenanceRecord memory)
    {
        return provenance[entityId];
    }

    /**
     * @notice Get complete version history
     * @param entityId Entity identifier
     * @return Array of all versions
     */
    function getVersionHistory(bytes32 entityId)
        external
        view
        entityExists(entityId)
        returns (Version[] memory)
    {
        return versionHistory[entityId];
    }

    /**
     * @notice Get specific version by number
     * @param entityId Entity identifier
     * @param versionNumber Version number (0-indexed)
     * @return Version data
     */
    function getVersion(bytes32 entityId, uint256 versionNumber)
        external
        view
        entityExists(entityId)
        returns (Version memory)
    {
        require(versionNumber < provenance[entityId].versionCount, "Version does not exist");
        bytes32 versionId = versionByNumber[entityId][versionNumber];
        return versions[versionId];
    }

    /**
     * @notice Get latest version
     * @param entityId Entity identifier
     * @return Latest version data
     */
    function getLatestVersion(bytes32 entityId)
        external
        view
        entityExists(entityId)
        returns (Version memory)
    {
        bytes32 latestVersionId = provenance[entityId].latestVersion;
        return versions[latestVersionId];
    }

    /**
     * @notice Get version count
     * @param entityId Entity identifier
     * @return Number of versions
     */
    function getVersionCount(bytes32 entityId)
        external
        view
        entityExists(entityId)
        returns (uint256)
    {
        return provenance[entityId].versionCount;
    }

    /**
     * @notice Get version chain (all version IDs in order)
     * @param entityId Entity identifier
     * @return Array of version IDs
     */
    function getVersionChain(bytes32 entityId)
        external
        view
        entityExists(entityId)
        returns (bytes32[] memory)
    {
        uint256 count = provenance[entityId].versionCount;
        bytes32[] memory chain = new bytes32[](count);

        for (uint256 i = 0; i < count; i++) {
            chain[i] = versionByNumber[entityId][i];
        }

        return chain;
    }

    /**
     * @notice Verify version authenticity
     * @param entityId Entity identifier
     * @param versionId Version ID to verify
     * @return exists Whether version exists
     * @return position Position in chain
     * @return author Version author
     */
    function verifyVersion(bytes32 entityId, bytes32 versionId)
        external
        view
        returns (
            bool exists,
            uint256 position,
            address author
        )
    {
        Version memory v = versions[versionId];

        if (v.timestamp == 0) {
            return (false, 0, address(0));
        }

        // Find position in chain
        uint256 count = provenance[entityId].versionCount;
        for (uint256 i = 0; i < count; i++) {
            if (versionByNumber[entityId][i] == versionId) {
                return (true, i, v.author);
            }
        }

        return (false, 0, address(0));
    }

    /**
     * @notice Get AI-generated versions
     * @param entityId Entity identifier
     * @return Array of AI-generated version numbers
     */
    function getAIGeneratedVersions(bytes32 entityId)
        external
        view
        entityExists(entityId)
        returns (uint256[] memory)
    {
        Version[] storage versions = versionHistory[entityId];
        uint256 count = 0;

        // Count AI-generated versions
        for (uint256 i = 0; i < versions.length; i++) {
            if (versions[i].aiGenerated) {
                count++;
            }
        }

        // Build result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < versions.length; i++) {
            if (versions[i].aiGenerated) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get versions by author
     * @param entityId Entity identifier
     * @param author Author address
     * @return Array of version numbers by this author
     */
    function getVersionsByAuthor(bytes32 entityId, address author)
        external
        view
        entityExists(entityId)
        returns (uint256[] memory)
    {
        Version[] storage versions = versionHistory[entityId];
        uint256 count = 0;

        // Count versions by author
        for (uint256 i = 0; i < versions.length; i++) {
            if (versions[i].author == author) {
                count++;
            }
        }

        // Build result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < versions.length; i++) {
            if (versions[i].author == author) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    // ==================== Statistics ====================

    /**
     * @notice Get platform statistics
     * @return entities Total entities tracked
     * @return versions Total versions created
     * @return avgVersions Average versions per entity
     */
    function getStatistics()
        external
        view
        returns (
            uint256 entities,
            uint256 versions,
            uint256 avgVersions
        )
    {
        uint256 avg = totalEntities > 0 ? totalVersions / totalEntities : 0;
        return (totalEntities, totalVersions, avg);
    }
}
