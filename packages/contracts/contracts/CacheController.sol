// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CacheController
 * @notice Cache invalidation management for client-side caching
 * @dev Replaces Redis cache invalidation with on-chain timestamps
 *
 * Frontend checks lastModified timestamp to determine if cache is stale
 */
contract CacheController {
    // ==================== State Variables ====================

    // Resource ID => Last modification timestamp
    mapping(bytes32 => uint256) public lastModified;

    // User => Array of invalidated resources
    mapping(address => bytes32[]) public userInvalidations;

    // Global invalidation counter (for cache busting)
    uint256 public globalInvalidationCount;

    // ==================== Events ====================

    event CacheInvalidated(
        bytes32 indexed resourceId,
        uint256 timestamp,
        address indexed invalidatedBy
    );

    event GlobalCacheInvalidated(
        uint256 invalidationId,
        uint256 timestamp
    );

    event BatchCacheInvalidated(
        bytes32[] resourceIds,
        uint256 timestamp
    );

    // ==================== Core Functions ====================

    /**
     * @notice Invalidate cache for a resource
     * @param resourceId Resource identifier
     */
    function invalidateCache(bytes32 resourceId) external {
        lastModified[resourceId] = block.timestamp;
        userInvalidations[msg.sender].push(resourceId);

        emit CacheInvalidated(resourceId, block.timestamp, msg.sender);
    }

    /**
     * @notice Batch invalidate multiple resources
     * @param resourceIds Array of resource IDs
     */
    function batchInvalidateCache(bytes32[] calldata resourceIds) external {
        uint256 timestamp = block.timestamp;

        for (uint256 i = 0; i < resourceIds.length; i++) {
            lastModified[resourceIds[i]] = timestamp;
            userInvalidations[msg.sender].push(resourceIds[i]);
        }

        emit BatchCacheInvalidated(resourceIds, timestamp);
    }

    /**
     * @notice Invalidate all caches (emergency use)
     */
    function globalInvalidate() external {
        globalInvalidationCount++;
        emit GlobalCacheInvalidated(globalInvalidationCount, block.timestamp);
    }

    // ==================== Query Functions ====================

    /**
     * @notice Get last modification timestamp
     * @param resourceId Resource ID
     * @return Timestamp of last modification
     */
    function getLastModified(bytes32 resourceId) external view returns (uint256) {
        return lastModified[resourceId];
    }

    /**
     * @notice Check if cache is valid
     * @param resourceId Resource ID
     * @param cacheTimestamp Timestamp of cached data
     * @return Whether cache is still valid
     */
    function isCacheValid(bytes32 resourceId, uint256 cacheTimestamp)
        external
        view
        returns (bool)
    {
        return lastModified[resourceId] <= cacheTimestamp;
    }

    /**
     * @notice Get user's invalidation history
     * @param user User address
     * @return Array of invalidated resource IDs
     */
    function getUserInvalidations(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return userInvalidations[user];
    }

    /**
     * @notice Get multiple last modified timestamps
     * @param resourceIds Array of resource IDs
     * @return Array of timestamps
     */
    function batchGetLastModified(bytes32[] calldata resourceIds)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory timestamps = new uint256[](resourceIds.length);

        for (uint256 i = 0; i < resourceIds.length; i++) {
            timestamps[i] = lastModified[resourceIds[i]];
        }

        return timestamps;
    }
}
