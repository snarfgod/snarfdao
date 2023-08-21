// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply) ERC20(name, symbol) {
        uint256 totalSupply = initialSupply * 10**decimals;
        _mint(msg.sender, totalSupply);
    }
}
