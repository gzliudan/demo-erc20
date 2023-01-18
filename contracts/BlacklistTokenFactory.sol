// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// ==================== Internal Imports ====================

import { BlacklistToken } from "./BlacklistToken.sol";

/// @title BlacklistTokenFactory
/// @author Daniel Liu
/// @dev BlacklistTokenFactory is used to deploy new BlacklistToken contracts.
/// @custom:security-contact 139250065@qq.com
contract BlacklistTokenFactory {
    // ==================== Variables ====================

    address[] public blacklistTokens;

    // ==================== Events ====================

    event CreateBlacklistToken(
        address indexed creater,
        address indexed token,
        string name,
        string symbol,
        uint256 quantity
    );

    // ==================== External functions ====================

    /**
     * @dev Creates a BlacklistToken smart contract.

     * @param  name      The name of the BlacklistToken
     * @param  symbol    The symbol of the BlacklistToken
     * @param  quantity  The tokens is mint to msg.sender, amount = quantity * 10 ** decimals()
     *
     * @return address   Address of the newly created BlacklistToken
     */
    function createBlacklistToken(
        string memory name,
        string memory symbol,
        uint256 quantity
    ) external returns (address) {
        BlacklistToken blacklistToken = new BlacklistToken(name, symbol, quantity);
        blacklistTokens.push(address(blacklistToken));

        // grant all roles to caller
        blacklistToken.grantRole(blacklistToken.DEFAULT_ADMIN_ROLE(), msg.sender);
        blacklistToken.grantRole(blacklistToken.ADMIN_ROLE(), msg.sender);
        blacklistToken.grantRole(blacklistToken.PAUSER_ROLE(), msg.sender);
        blacklistToken.grantRole(blacklistToken.MINTER_ROLE(), msg.sender);

        // revoke all roles from factory
        blacklistToken.renounceRole(blacklistToken.DEFAULT_ADMIN_ROLE(), address(this));
        blacklistToken.renounceRole(blacklistToken.ADMIN_ROLE(), address(this));
        blacklistToken.renounceRole(blacklistToken.PAUSER_ROLE(), address(this));
        blacklistToken.renounceRole(blacklistToken.MINTER_ROLE(), address(this));

        blacklistToken.transfer(msg.sender, blacklistToken.balanceOf(address(this)));

        emit CreateBlacklistToken(msg.sender, address(blacklistToken), name, symbol, quantity);

        return address(blacklistToken);
    }
}
