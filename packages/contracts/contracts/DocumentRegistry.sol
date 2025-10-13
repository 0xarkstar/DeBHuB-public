// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IProgrammableData.sol";

/**
 * @title DocumentRegistry
 * @notice Core registry for all documents stored on Irys DataChain
 * @dev Replaces PostgreSQL tables and indexes with on-chain mappings
 *
 * This contract serves as the central index for all documents, providing:
 * - Document metadata storage
 * - Multi-dimensional indexing (by owner, project, tag, status)
 * - Query functions for efficient retrieval
 * - State management (draft, published, archived)
 */
contract DocumentRegistry is ProgrammableDataBase {
    // ==================== State Variables ====================

    struct Document {
        bytes32 irysId;           // Irys transaction ID (permanent storage reference)
        address owner;            // Document owner
        uint256 createdAt;        // Creation timestamp
        uint256 updatedAt;        // Last update timestamp
        bytes32 projectId;        // Associated project
        string title;             // Document title (searchable)
        bool isPublic;            // Public visibility
        uint8 status;             // 0=draft, 1=published, 2=archived
        uint256 viewCount;        // View counter
    }

    // Primary storage
    mapping(bytes32 => Document) public documents;

    // Indexes (replacing PostgreSQL indexes)
    mapping(address => bytes32[]) public documentsByOwner;
    mapping(bytes32 => bytes32[]) public documentsByProject;
    mapping(bytes32 => bytes32[]) public documentsByTag;
    mapping(uint8 => bytes32[]) public documentsByStatus;

    // Reverse index for efficient lookups
    mapping(bytes32 => uint256) private ownerIndexPosition;
    mapping(bytes32 => uint256) private projectIndexPosition;

    // Statistics
    uint256 public totalDocuments;
    uint256 public totalPublishedDocuments;

    // ==================== Events ====================

    event DocumentRegistered(
        bytes32 indexed docId,
        bytes32 indexed irysId,
        address indexed owner,
        bytes32 projectId,
        string title
    );

    event DocumentUpdated(
        bytes32 indexed docId,
        uint256 timestamp,
        address updater
    );

    event DocumentStatusChanged(
        bytes32 indexed docId,
        uint8 oldStatus,
        uint8 newStatus
    );

    event DocumentViewed(
        bytes32 indexed docId,
        address viewer
    );

    // ==================== Modifiers ====================

    modifier onlyOwner(bytes32 docId) {
        require(documents[docId].owner == msg.sender, "Not document owner");
        _;
    }

    modifier documentExists(bytes32 docId) {
        require(documents[docId].createdAt != 0, "Document does not exist");
        _;
    }

    // ==================== Core Functions ====================

    /**
     * @notice Register a new document
     * @param irysId Irys transaction ID where actual content is stored
     * @param projectId Associated project ID
     * @param title Document title
     * @param tags Array of tag hashes for categorization
     * @return docId Generated unique document ID
     */
    function registerDocument(
        bytes32 irysId,
        bytes32 projectId,
        string memory title,
        bytes32[] memory tags
    ) external returns (bytes32) {
        require(verifyIrysData(irysId), "Invalid Irys ID");
        require(bytes(title).length > 0, "Title cannot be empty");

        // Generate unique document ID
        bytes32 docId = keccak256(
            abi.encodePacked(irysId, msg.sender, block.timestamp, totalDocuments)
        );

        // Create document
        documents[docId] = Document({
            irysId: irysId,
            owner: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            projectId: projectId,
            title: title,
            isPublic: false,
            status: 0, // draft
            viewCount: 0
        });

        // Build indexes
        documentsByOwner[msg.sender].push(docId);
        ownerIndexPosition[docId] = documentsByOwner[msg.sender].length - 1;

        if (projectId != bytes32(0)) {
            documentsByProject[projectId].push(docId);
            projectIndexPosition[docId] = documentsByProject[projectId].length - 1;
        }

        documentsByStatus[0].push(docId);

        // Index tags
        for (uint256 i = 0; i < tags.length; i++) {
            documentsByTag[tags[i]].push(docId);
        }

        // Update counters
        totalDocuments++;

        emit DocumentRegistered(docId, irysId, msg.sender, projectId, title);

        return docId;
    }

    /**
     * @notice Update document metadata
     * @param docId Document ID
     * @param newIrysId New Irys transaction ID (for updated content)
     * @param newTitle New title
     */
    function updateDocument(
        bytes32 docId,
        bytes32 newIrysId,
        string memory newTitle
    ) external onlyOwner(docId) documentExists(docId) {
        Document storage doc = documents[docId];

        if (newIrysId != bytes32(0)) {
            require(verifyIrysData(newIrysId), "Invalid Irys ID");
            doc.irysId = newIrysId;
        }

        if (bytes(newTitle).length > 0) {
            doc.title = newTitle;
        }

        doc.updatedAt = block.timestamp;

        emit DocumentUpdated(docId, block.timestamp, msg.sender);
    }

    /**
     * @notice Change document status
     * @param docId Document ID
     * @param newStatus New status (0=draft, 1=published, 2=archived)
     */
    function setDocumentStatus(bytes32 docId, uint8 newStatus)
        external
        onlyOwner(docId)
        documentExists(docId)
    {
        require(newStatus <= 2, "Invalid status");

        Document storage doc = documents[docId];
        uint8 oldStatus = doc.status;

        if (oldStatus != newStatus) {
            doc.status = newStatus;
            doc.updatedAt = block.timestamp;

            // Update status index
            documentsByStatus[newStatus].push(docId);

            // Update published counter
            if (newStatus == 1 && oldStatus != 1) {
                totalPublishedDocuments++;
            } else if (oldStatus == 1 && newStatus != 1) {
                totalPublishedDocuments--;
            }

            emit DocumentStatusChanged(docId, oldStatus, newStatus);
        }
    }

    /**
     * @notice Set document visibility
     * @param docId Document ID
     * @param isPublic Whether document is public
     */
    function setDocumentVisibility(bytes32 docId, bool isPublic)
        external
        onlyOwner(docId)
        documentExists(docId)
    {
        documents[docId].isPublic = isPublic;
        documents[docId].updatedAt = block.timestamp;
    }

    /**
     * @notice Increment view count
     * @param docId Document ID
     */
    function incrementViewCount(bytes32 docId) external documentExists(docId) {
        documents[docId].viewCount++;
        emit DocumentViewed(docId, msg.sender);
    }

    // ==================== Query Functions ====================

    /**
     * @notice Get document by ID
     * @param docId Document ID
     * @return Document struct
     */
    function getDocument(bytes32 docId)
        external
        view
        documentExists(docId)
        returns (Document memory)
    {
        return documents[docId];
    }

    /**
     * @notice Get all documents by owner
     * @param owner Owner address
     * @return Array of document IDs
     */
    function getDocumentsByOwner(address owner)
        external
        view
        returns (bytes32[] memory)
    {
        return documentsByOwner[owner];
    }

    /**
     * @notice Get all documents in a project
     * @param projectId Project ID
     * @return Array of document IDs
     */
    function getDocumentsByProject(bytes32 projectId)
        external
        view
        returns (bytes32[] memory)
    {
        return documentsByProject[projectId];
    }

    /**
     * @notice Get all documents with a specific tag
     * @param tag Tag hash
     * @return Array of document IDs
     */
    function getDocumentsByTag(bytes32 tag)
        external
        view
        returns (bytes32[] memory)
    {
        return documentsByTag[tag];
    }

    /**
     * @notice Get all documents with a specific status
     * @param status Status (0=draft, 1=published, 2=archived)
     * @return Array of document IDs
     */
    function getDocumentsByStatus(uint8 status)
        external
        view
        returns (bytes32[] memory)
    {
        require(status <= 2, "Invalid status");
        return documentsByStatus[status];
    }

    /**
     * @notice Get paginated documents by owner
     * @param owner Owner address
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of document IDs
     */
    function getDocumentsByOwnerPaginated(
        address owner,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        bytes32[] storage allDocs = documentsByOwner[owner];
        uint256 total = allDocs.length;

        if (offset >= total) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        bytes32[] memory result = new bytes32[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allDocs[offset + i];
        }

        return result;
    }

    /**
     * @notice Get document count by owner
     * @param owner Owner address
     * @return Number of documents
     */
    function getDocumentCountByOwner(address owner)
        external
        view
        returns (uint256)
    {
        return documentsByOwner[owner].length;
    }

    /**
     * @notice Get document count by project
     * @param projectId Project ID
     * @return Number of documents
     */
    function getDocumentCountByProject(bytes32 projectId)
        external
        view
        returns (uint256)
    {
        return documentsByProject[projectId].length;
    }

    /**
     * @notice Check if document exists
     * @param docId Document ID
     * @return Whether document exists
     */
    function isDocumentExists(bytes32 docId) external view returns (bool) {
        return documents[docId].createdAt != 0;
    }

    // ==================== Statistics ====================

    /**
     * @notice Get platform statistics
     * @return total Total documents
     * @return published Published documents
     * @return drafts Draft documents
     * @return archived Archived documents
     */
    function getStatistics()
        external
        view
        returns (
            uint256 total,
            uint256 published,
            uint256 drafts,
            uint256 archived
        )
    {
        return (
            totalDocuments,
            totalPublishedDocuments,
            documentsByStatus[0].length,
            documentsByStatus[2].length
        );
    }
}
