// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VectorRegistry
 * @notice On-chain registry for vector embeddings stored on Irys
 * @dev Enables semantic search by indexing vector metadata and clustering
 *
 * Architecture:
 * - Vectors are stored on Irys DataChain (immutable, permanent)
 * - Metadata and cluster indices are stored on-chain (queryable)
 * - Client-side similarity calculations (cosine similarity)
 */
contract VectorRegistry {
    // ==================== Types ====================

    struct VectorMetadata {
        bytes32 docId;           // Document ID
        bytes32 irysVectorId;    // Irys transaction ID where vector is stored
        address owner;           // Owner of the vector
        uint256 dimensions;      // Vector dimensions (e.g., 1536 for OpenAI)
        string embeddingModel;   // Model used (e.g., "text-embedding-3-small")
        bytes32 clusterId;       // Cluster ID for fast search
        uint256 timestamp;       // Creation timestamp
        bool active;             // Soft delete flag
    }

    struct ClusterInfo {
        uint256 vectorCount;
        uint256 lastUpdated;
    }

    // ==================== State Variables ====================

    // Document ID => Vector Metadata
    mapping(bytes32 => VectorMetadata) public vectors;

    // Cluster ID => Document IDs (for fast search)
    mapping(bytes32 => bytes32[]) public clusterIndex;

    // Cluster ID => Cluster Info
    mapping(bytes32 => ClusterInfo) public clusters;

    // Owner => Document IDs
    mapping(address => bytes32[]) public ownerVectors;

    // Statistics
    uint256 public totalVectors;
    uint256 public totalClusters;
    uint256 public activeVectors;

    // ==================== Events ====================

    event VectorRegistered(
        bytes32 indexed docId,
        bytes32 indexed irysVectorId,
        bytes32 indexed clusterId,
        address owner,
        uint256 dimensions,
        string embeddingModel
    );

    event VectorUpdated(
        bytes32 indexed docId,
        bytes32 newIrysVectorId,
        bytes32 newClusterId
    );

    event VectorDeactivated(
        bytes32 indexed docId,
        uint256 timestamp
    );

    event ClusterCreated(
        bytes32 indexed clusterId,
        uint256 timestamp
    );

    // ==================== Modifiers ====================

    modifier onlyVectorOwner(bytes32 docId) {
        require(vectors[docId].owner == msg.sender, "Not vector owner");
        _;
    }

    modifier vectorExists(bytes32 docId) {
        require(vectors[docId].timestamp > 0, "Vector does not exist");
        _;
    }

    // ==================== Core Functions ====================

    /**
     * @notice Register a new vector embedding
     * @param docId Document ID
     * @param irysVectorId Irys transaction ID where vector JSON is stored
     * @param dimensions Vector dimensions
     * @param embeddingModel Model name (e.g., "text-embedding-3-small")
     * @param clusterId Cluster ID calculated via LSH
     */
    function registerVector(
        bytes32 docId,
        bytes32 irysVectorId,
        uint256 dimensions,
        string memory embeddingModel,
        bytes32 clusterId
    ) external {
        require(vectors[docId].timestamp == 0, "Vector already registered");
        require(dimensions > 0, "Invalid dimensions");
        require(bytes(embeddingModel).length > 0, "Model required");

        // Create vector metadata
        vectors[docId] = VectorMetadata({
            docId: docId,
            irysVectorId: irysVectorId,
            owner: msg.sender,
            dimensions: dimensions,
            embeddingModel: embeddingModel,
            clusterId: clusterId,
            timestamp: block.timestamp,
            active: true
        });

        // Add to cluster index
        if (clusterIndex[clusterId].length == 0) {
            totalClusters++;
            emit ClusterCreated(clusterId, block.timestamp);
        }

        clusterIndex[clusterId].push(docId);
        clusters[clusterId].vectorCount++;
        clusters[clusterId].lastUpdated = block.timestamp;

        // Add to owner index
        ownerVectors[msg.sender].push(docId);

        // Update stats
        totalVectors++;
        activeVectors++;

        emit VectorRegistered(
            docId,
            irysVectorId,
            clusterId,
            msg.sender,
            dimensions,
            embeddingModel
        );
    }

    /**
     * @notice Update vector (new version)
     * @param docId Document ID
     * @param newIrysVectorId New Irys transaction ID
     * @param newClusterId New cluster ID
     */
    function updateVector(
        bytes32 docId,
        bytes32 newIrysVectorId,
        bytes32 newClusterId
    ) external onlyVectorOwner(docId) vectorExists(docId) {
        VectorMetadata storage vector = vectors[docId];
        require(vector.active, "Vector is inactive");

        bytes32 oldClusterId = vector.clusterId;

        // Update metadata
        vector.irysVectorId = newIrysVectorId;
        vector.clusterId = newClusterId;
        vector.timestamp = block.timestamp;

        // Update cluster indices if cluster changed
        if (oldClusterId != newClusterId) {
            // Add to new cluster
            if (clusterIndex[newClusterId].length == 0) {
                totalClusters++;
                emit ClusterCreated(newClusterId, block.timestamp);
            }

            clusterIndex[newClusterId].push(docId);
            clusters[newClusterId].vectorCount++;
            clusters[newClusterId].lastUpdated = block.timestamp;

            // Decrement old cluster (lazy cleanup)
            if (clusters[oldClusterId].vectorCount > 0) {
                clusters[oldClusterId].vectorCount--;
            }
        }

        emit VectorUpdated(docId, newIrysVectorId, newClusterId);
    }

    /**
     * @notice Deactivate vector (soft delete)
     * @param docId Document ID
     */
    function deactivateVector(bytes32 docId)
        external
        onlyVectorOwner(docId)
        vectorExists(docId)
    {
        VectorMetadata storage vector = vectors[docId];
        require(vector.active, "Already inactive");

        vector.active = false;

        // Update cluster count
        bytes32 clusterId = vector.clusterId;
        if (clusters[clusterId].vectorCount > 0) {
            clusters[clusterId].vectorCount--;
        }

        // Update stats
        if (activeVectors > 0) {
            activeVectors--;
        }

        emit VectorDeactivated(docId, block.timestamp);
    }

    // ==================== Query Functions ====================

    /**
     * @notice Get vector metadata
     * @param docId Document ID
     * @return Vector metadata
     */
    function getVector(bytes32 docId)
        external
        view
        returns (VectorMetadata memory)
    {
        return vectors[docId];
    }

    /**
     * @notice Get vectors in a cluster (for semantic search)
     * @param clusterId Cluster ID
     * @return Array of document IDs
     */
    function getVectorsByCluster(bytes32 clusterId)
        external
        view
        returns (bytes32[] memory)
    {
        return clusterIndex[clusterId];
    }

    /**
     * @notice Get active vectors in a cluster
     * @param clusterId Cluster ID
     * @return Array of active document IDs
     */
    function getActiveVectorsByCluster(bytes32 clusterId)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] storage allVectors = clusterIndex[clusterId];
        uint256 activeCount = 0;

        // Count active vectors
        for (uint256 i = 0; i < allVectors.length; i++) {
            if (vectors[allVectors[i]].active) {
                activeCount++;
            }
        }

        // Build result array
        bytes32[] memory activeVectorList = new bytes32[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allVectors.length; i++) {
            if (vectors[allVectors[i]].active) {
                activeVectorList[index] = allVectors[i];
                index++;
            }
        }

        return activeVectorList;
    }

    /**
     * @notice Get vectors by owner
     * @param owner Owner address
     * @return Array of document IDs
     */
    function getVectorsByOwner(address owner)
        external
        view
        returns (bytes32[] memory)
    {
        return ownerVectors[owner];
    }

    /**
     * @notice Get cluster info
     * @param clusterId Cluster ID
     * @return Cluster information
     */
    function getClusterInfo(bytes32 clusterId)
        external
        view
        returns (ClusterInfo memory)
    {
        return clusters[clusterId];
    }

    /**
     * @notice Check if vector exists and is active
     * @param docId Document ID
     * @return Whether vector is active
     */
    function isActive(bytes32 docId) external view returns (bool) {
        return vectors[docId].active;
    }

    /**
     * @notice Batch get vector metadata
     * @param docIds Array of document IDs
     * @return Array of vector metadata
     */
    function batchGetVectors(bytes32[] calldata docIds)
        external
        view
        returns (VectorMetadata[] memory)
    {
        VectorMetadata[] memory results = new VectorMetadata[](docIds.length);

        for (uint256 i = 0; i < docIds.length; i++) {
            results[i] = vectors[docIds[i]];
        }

        return results;
    }

    // ==================== Statistics ====================

    /**
     * @notice Get registry statistics
     * @return total Total vectors registered
     * @return active Active vectors
     * @return clustersCount Total clusters
     */
    function getStatistics()
        external
        view
        returns (
            uint256 total,
            uint256 active,
            uint256 clustersCount
        )
    {
        return (totalVectors, activeVectors, totalClusters);
    }

    /**
     * @notice Get cluster statistics
     * @param clusterIds Array of cluster IDs
     * @return counts Array of vector counts per cluster
     */
    function getClusterStatistics(bytes32[] calldata clusterIds)
        external
        view
        returns (uint256[] memory counts)
    {
        counts = new uint256[](clusterIds.length);

        for (uint256 i = 0; i < clusterIds.length; i++) {
            counts[i] = clusters[clusterIds[i]].vectorCount;
        }

        return counts;
    }
}
