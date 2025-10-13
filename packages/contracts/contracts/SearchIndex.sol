// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SearchIndex
 * @notice On-chain search indexing for documents
 * @dev Replaces PostgreSQL full-text search with keyword-based on-chain index
 *
 * Note: For large-scale search, combine this with Irys Query SDK
 */
contract SearchIndex {
    // ==================== Types ====================

    struct IndexEntry {
        bytes32 docId;
        uint256 relevance;
        uint256 timestamp;
    }

    // ==================== State Variables ====================

    // Keyword hash => Document IDs
    mapping(bytes32 => bytes32[]) public keywordIndex;

    // Keyword + DocId => Relevance score
    mapping(bytes32 => mapping(bytes32 => uint256)) public relevanceScores;

    // Document => Keywords
    mapping(bytes32 => bytes32[]) public documentKeywords;

    // Statistics
    uint256 public totalIndexedDocuments;
    uint256 public totalKeywords;

    // ==================== Events ====================

    event DocumentIndexed(
        bytes32 indexed docId,
        uint256 keywordCount,
        uint256 timestamp
    );

    event DocumentReindexed(
        bytes32 indexed docId,
        uint256 keywordCount,
        uint256 timestamp
    );

    event DocumentRemovedFromIndex(
        bytes32 indexed docId,
        uint256 timestamp
    );

    // ==================== Core Functions ====================

    /**
     * @notice Index a document with keywords
     * @param docId Document ID
     * @param keywords Array of keyword hashes
     */
    function indexDocument(bytes32 docId, bytes32[] calldata keywords) external {
        require(keywords.length > 0, "Must provide keywords");
        require(documentKeywords[docId].length == 0, "Document already indexed");

        // Store keywords for this document
        documentKeywords[docId] = keywords;

        // Build reverse index
        for (uint256 i = 0; i < keywords.length; i++) {
            bytes32 keyword = keywords[i];

            // Add to keyword index
            if (keywordIndex[keyword].length == 0) {
                totalKeywords++;
            }

            keywordIndex[keyword].push(docId);

            // Calculate relevance (simple: keyword frequency)
            relevanceScores[keyword][docId]++;
        }

        totalIndexedDocuments++;

        emit DocumentIndexed(docId, keywords.length, block.timestamp);
    }

    /**
     * @notice Reindex document with new keywords
     * @param docId Document ID
     * @param newKeywords New array of keyword hashes
     */
    function reindexDocument(bytes32 docId, bytes32[] calldata newKeywords) external {
        require(newKeywords.length > 0, "Must provide keywords");
        require(documentKeywords[docId].length > 0, "Document not indexed");

        // Remove old keywords (lazy - don't clean up keyword arrays)
        bytes32[] storage oldKeywords = documentKeywords[docId];
        for (uint256 i = 0; i < oldKeywords.length; i++) {
            delete relevanceScores[oldKeywords[i]][docId];
        }

        // Update with new keywords
        documentKeywords[docId] = newKeywords;

        for (uint256 i = 0; i < newKeywords.length; i++) {
            bytes32 keyword = newKeywords[i];

            if (keywordIndex[keyword].length == 0) {
                totalKeywords++;
            }

            keywordIndex[keyword].push(docId);
            relevanceScores[keyword][docId]++;
        }

        emit DocumentReindexed(docId, newKeywords.length, block.timestamp);
    }

    /**
     * @notice Remove document from index
     * @param docId Document ID
     */
    function removeFromIndex(bytes32 docId) external {
        bytes32[] storage keywords = documentKeywords[docId];
        require(keywords.length > 0, "Document not indexed");

        // Clear relevance scores
        for (uint256 i = 0; i < keywords.length; i++) {
            delete relevanceScores[keywords[i]][docId];
        }

        delete documentKeywords[docId];
        totalIndexedDocuments--;

        emit DocumentRemovedFromIndex(docId, block.timestamp);
    }

    // ==================== Search Functions ====================

    /**
     * @notice Search by single keyword
     * @param keyword Keyword hash
     * @return Array of document IDs
     */
    function search(bytes32 keyword) external view returns (bytes32[] memory) {
        return keywordIndex[keyword];
    }

    /**
     * @notice Search with relevance scoring
     * @param keyword Keyword hash
     * @param limit Maximum results
     * @return docIds Array of document IDs
     * @return scores Array of relevance scores
     */
    function searchWithRelevance(bytes32 keyword, uint256 limit)
        external
        view
        returns (bytes32[] memory docIds, uint256[] memory scores)
    {
        bytes32[] storage allDocs = keywordIndex[keyword];
        uint256 resultCount = allDocs.length > limit ? limit : allDocs.length;

        docIds = new bytes32[](resultCount);
        scores = new uint256[](resultCount);

        // Simple: return first N results with their scores
        // In production, would sort by relevance
        for (uint256 i = 0; i < resultCount; i++) {
            docIds[i] = allDocs[i];
            scores[i] = relevanceScores[keyword][allDocs[i]];
        }

        return (docIds, scores);
    }

    /**
     * @notice Multi-keyword search (AND logic)
     * @param keywords Array of keyword hashes
     * @return Array of document IDs matching all keywords
     */
    function multiKeywordSearch(bytes32[] calldata keywords)
        external
        view
        returns (bytes32[] memory)
    {
        require(keywords.length > 0, "Must provide keywords");

        // Start with first keyword's results
        bytes32[] storage firstResults = keywordIndex[keywords[0]];

        if (keywords.length == 1) {
            return firstResults;
        }

        // Find intersection with other keywords
        uint256 count = 0;
        bool[] memory isMatch = new bool[](firstResults.length);

        for (uint256 i = 0; i < firstResults.length; i++) {
            bytes32 docId = firstResults[i];
            bool matchesAll = true;

            // Check if document has all other keywords
            for (uint256 j = 1; j < keywords.length; j++) {
                if (relevanceScores[keywords[j]][docId] == 0) {
                    matchesAll = false;
                    break;
                }
            }

            if (matchesAll) {
                isMatch[i] = true;
                count++;
            }
        }

        // Build result array
        bytes32[] memory results = new bytes32[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < firstResults.length; i++) {
            if (isMatch[i]) {
                results[index] = firstResults[i];
                index++;
            }
        }

        return results;
    }

    // ==================== Query Functions ====================

    /**
     * @notice Get keywords for a document
     * @param docId Document ID
     * @return Array of keyword hashes
     */
    function getDocumentKeywords(bytes32 docId)
        external
        view
        returns (bytes32[] memory)
    {
        return documentKeywords[docId];
    }

    /**
     * @notice Get relevance score
     * @param keyword Keyword hash
     * @param docId Document ID
     * @return Relevance score
     */
    function getRelevanceScore(bytes32 keyword, bytes32 docId)
        external
        view
        returns (uint256)
    {
        return relevanceScores[keyword][docId];
    }

    /**
     * @notice Get document count for keyword
     * @param keyword Keyword hash
     * @return Number of documents with this keyword
     */
    function getDocumentCountForKeyword(bytes32 keyword)
        external
        view
        returns (uint256)
    {
        return keywordIndex[keyword].length;
    }

    /**
     * @notice Check if document is indexed
     * @param docId Document ID
     * @return Whether document is indexed
     */
    function isIndexed(bytes32 docId) external view returns (bool) {
        return documentKeywords[docId].length > 0;
    }

    // ==================== Statistics ====================

    /**
     * @notice Get index statistics
     * @return documents Total indexed documents
     * @return keywords Total unique keywords
     */
    function getStatistics()
        external
        view
        returns (uint256 documents, uint256 keywords)
    {
        return (totalIndexedDocuments, totalKeywords);
    }
}
