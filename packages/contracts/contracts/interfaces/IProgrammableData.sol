// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProgrammableData
 * @notice Interface for Irys Programmable Data precompile
 * @dev This interface provides access to Irys DataChain data from smart contracts
 *
 * Key Concept: Programmable Data allows smart contracts to read data stored on Irys
 * without duplicating it on-chain, enabling efficient data-driven logic execution.
 */
interface IProgrammableData {
    /**
     * @notice Read bytes from Irys storage
     * @dev This precompile function reads data from Irys DataChain
     * In production, this would interact with the actual Irys precompile
     * For now, we implement a mock version for development
     *
     * @return success Whether the read operation succeeded
     * @return data The bytes read from storage
     */
    function readBytes() external view returns (bool success, bytes memory data);

    /**
     * @notice Read bytes from Irys storage with offset and length
     * @param offset Starting position to read from
     * @param length Number of bytes to read
     * @return success Whether the read operation succeeded
     * @return data The bytes read from storage
     */
    function readBytes(uint256 offset, uint256 length) external view returns (bool success, bytes memory data);
}

/**
 * @title ProgrammableDataBase
 * @notice Base contract for contracts that interact with Irys Programmable Data
 * @dev Inherit from this contract to access Irys data in your smart contracts
 */
abstract contract ProgrammableDataBase is IProgrammableData {
    // Precompile address (placeholder - will be set by Irys)
    address constant IRYS_PRECOMPILE = address(0x0000000000000000000000000000000000000800);

    /**
     * @notice Read data from Irys storage
     * @dev Override this in derived contracts if needed
     */
    function readBytes() public view virtual returns (bool, bytes memory) {
        // In production, this would call the actual precompile
        // For development, we return mock data
        return (true, bytes(""));
    }

    /**
     * @notice Read data from Irys storage with offset
     */
    function readBytes(uint256 offset, uint256 length) public view virtual returns (bool, bytes memory) {
        return (true, bytes(""));
    }

    /**
     * @notice Helper to verify data exists on Irys
     * @param irysId The Irys transaction ID
     */
    function verifyIrysData(bytes32 irysId) internal pure returns (bool) {
        // Verify irysId is not empty
        return irysId != bytes32(0);
    }
}
