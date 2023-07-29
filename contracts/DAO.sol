//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.18;

import 'hardhat/console.sol';

import './Token.sol';

contract DAO {

    address public owner;
    Token public token;
    uint256 public quorum;

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    receive() external payable {}
    
}
