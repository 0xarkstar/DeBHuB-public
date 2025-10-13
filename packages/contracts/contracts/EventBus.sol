// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EventBus
 * @notice Centralized event system for real-time notifications
 * @dev Replaces WebSocket + Redis pub/sub with blockchain events
 *
 * Frontend listens to these events for real-time updates without polling
 */
contract EventBus {
    // ==================== Document Events ====================

    event DocumentCreated(
        bytes32 indexed docId,
        bytes32 indexed projectId,
        address indexed author,
        string title,
        uint256 timestamp
    );

    event DocumentUpdated(
        bytes32 indexed docId,
        address indexed author,
        bytes32 newVersionId,
        uint256 timestamp
    );

    event DocumentDeleted(
        bytes32 indexed docId,
        address indexed author,
        uint256 timestamp
    );

    event DocumentPublished(
        bytes32 indexed docId,
        address indexed author,
        uint256 timestamp
    );

    event DocumentUnpublished(
        bytes32 indexed docId,
        address indexed author,
        uint256 timestamp
    );

    // ==================== Collaboration Events ====================

    event CollaboratorAdded(
        bytes32 indexed resourceId,
        address indexed collaborator,
        address indexed addedBy,
        uint8 permission
    );

    event CollaboratorRemoved(
        bytes32 indexed resourceId,
        address indexed collaborator,
        address indexed removedBy
    );

    event CommentAdded(
        bytes32 indexed docId,
        bytes32 indexed commentId,
        address indexed author,
        uint256 timestamp
    );

    event CommentUpdated(
        bytes32 indexed commentId,
        address indexed author,
        uint256 timestamp
    );

    event CommentDeleted(
        bytes32 indexed commentId,
        address indexed author,
        uint256 timestamp
    );

    // ==================== Project Events ====================

    event ProjectCreated(
        bytes32 indexed projectId,
        address indexed owner,
        string name,
        uint256 timestamp
    );

    event ProjectUpdated(
        bytes32 indexed projectId,
        address indexed updater,
        uint256 timestamp
    );

    event ProjectDeleted(
        bytes32 indexed projectId,
        address indexed owner,
        uint256 timestamp
    );

    // ==================== User Events ====================

    event UserRegistered(
        address indexed user,
        uint256 timestamp
    );

    event UserProfileUpdated(
        address indexed user,
        uint256 timestamp
    );

    // ==================== Activity Events ====================

    event ViewRecorded(
        bytes32 indexed resourceId,
        address indexed viewer,
        uint256 timestamp
    );

    event LikeAdded(
        bytes32 indexed resourceId,
        address indexed user,
        uint256 timestamp
    );

    event LikeRemoved(
        bytes32 indexed resourceId,
        address indexed user,
        uint256 timestamp
    );

    // ==================== Emit Functions ====================

    function emitDocumentCreated(
        bytes32 docId,
        bytes32 projectId,
        string memory title
    ) external {
        emit DocumentCreated(docId, projectId, msg.sender, title, block.timestamp);
    }

    function emitDocumentUpdated(bytes32 docId, bytes32 newVersionId) external {
        emit DocumentUpdated(docId, msg.sender, newVersionId, block.timestamp);
    }

    function emitDocumentPublished(bytes32 docId) external {
        emit DocumentPublished(docId, msg.sender, block.timestamp);
    }

    function emitCollaboratorAdded(
        bytes32 resourceId,
        address collaborator,
        uint8 permission
    ) external {
        emit CollaboratorAdded(resourceId, collaborator, msg.sender, permission);
    }

    function emitCommentAdded(bytes32 docId, bytes32 commentId) external {
        emit CommentAdded(docId, commentId, msg.sender, block.timestamp);
    }

    function emitViewRecorded(bytes32 resourceId) external {
        emit ViewRecorded(resourceId, msg.sender, block.timestamp);
    }
}
