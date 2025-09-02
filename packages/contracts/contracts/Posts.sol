// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AuthRoles.sol";

contract Posts {
    AuthRoles public authContract;
    
    event PostCreated(address indexed author, string irysTransactionId, uint256 timestamp);
    event PostUpdated(address indexed author, string newTransactionId, string previousTransactionId);
    
    modifier onlyCreator() {
        require(
            authContract.hasRole(msg.sender, "creator"),
            "Unauthorized: creator role required"
        );
        _;
    }
    
    constructor(address _authContract) {
        authContract = AuthRoles(_authContract);
    }
    
    function registerPost(string memory irysTransactionId) external onlyCreator {
        require(bytes(irysTransactionId).length > 0, "Irys transaction ID cannot be empty");
        
        emit PostCreated(msg.sender, irysTransactionId, block.timestamp);
    }
    
    function updatePost(
        string memory newTransactionId,
        string memory previousTransactionId
    ) external onlyCreator {
        require(bytes(newTransactionId).length > 0, "New transaction ID cannot be empty");
        require(bytes(previousTransactionId).length > 0, "Previous transaction ID cannot be empty");
        
        emit PostUpdated(msg.sender, newTransactionId, previousTransactionId);
    }
}