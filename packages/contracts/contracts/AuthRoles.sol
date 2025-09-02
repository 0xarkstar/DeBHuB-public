// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Note: @irys/precompile-libraries/ProgrammableData.sol would be imported in production
// For now using a mock interface
interface ProgrammableData {
    // Mock interface for IrysVM ProgrammableData
}

contract AuthRoles {
    address public owner;
    
    mapping(address => string) public roles;
    
    event RoleAssigned(address indexed user, string role);
    event RoleRevoked(address indexed user, string role);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function assignRole(address user, string memory role) external onlyOwner {
        roles[user] = role;
        emit RoleAssigned(user, role);
    }
    
    function revokeRole(address user, string memory role) external onlyOwner {
        delete roles[user];
        emit RoleRevoked(user, role);
    }
    
    function hasRole(address user, string memory role) external view returns (bool) {
        return keccak256(bytes(roles[user])) == keccak256(bytes(role));
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}