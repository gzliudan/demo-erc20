// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/// @title   BlockTime
/// @author  Daniel Liu
/// @dev     Calculate the average block time
/// @custom:security-contact 139250065@qq.com
contract BlockTime {
    // ==================== Variables ====================

    uint256 public beginBlockNumber;
    uint256 public beginBlockTimestamp;

    // ==================== Constructor function ====================

    constructor() {
        initTime();
    }

    function initTime() public {
        beginBlockNumber = block.number;
        beginBlockTimestamp = block.timestamp;
    }

    /// @return  avgBlockTime_ms    The average block time(millisecond)
    function getAvgBlockTime() external view returns (uint256 avgBlockTime_ms) {
        uint256 endBlockNumber = block.number;
        uint256 endBlockTimestamp = block.timestamp;

        uint256 passedTime_ms = (endBlockTimestamp - beginBlockTimestamp) * 1000;
        uint256 passedBlocks = endBlockNumber - beginBlockNumber;

        avgBlockTime_ms = passedTime_ms / passedBlocks;
    }
}
