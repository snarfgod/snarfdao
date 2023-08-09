//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.18;

import 'hardhat/console.sol';

import './Token.sol';

contract DAO {

    address public owner;
    Token public token;
    uint256 public quorum;

    struct Proposal {
        uint256 id;
        string name;
        string description;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        bool finalized;
    }   



    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public votes;

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );

    event Voted(
        uint id,
        uint256 votes,
        address voter
    );

    event Finalize(uint id);

    modifier onlyInvestor() {
        require(token.balanceOf(msg.sender) > 0, 'must be a token holder');
        _;
    }

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    receive() external payable {}



    function createProposal(
        string memory _name,
        string memory _description, 
        uint256 _amount,
        address payable _recipient
    ) external onlyInvestor {
        require(address(this).balance >= _amount, 'not enough funds');
        proposalCount++;
        
        proposals[proposalCount] = Proposal(proposalCount, _name, _description, _amount, _recipient, 0, false);
        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    function vote(uint256 _id) external onlyInvestor {
        //Fetch proposal from mapping ID
        Proposal storage proposal = proposals[_id];
        //check that the sender has not voted before
        require(!votes[msg.sender][_id], 'cannot vote twice');
        //update votes
        proposal.votes += token.balanceOf(msg.sender);

        //track that the user has voted
        votes[msg.sender][_id] = true;
        //emit an event
        emit Voted(_id, proposal.votes, msg.sender);
    }

    function downVote(uint256 _id) external onlyInvestor {
        //Fetch proposal from mapping ID
        Proposal storage proposal = proposals[_id];
        //check that the sender has not voted before
        require(!votes[msg.sender][_id], 'cannot vote twice');
        //update votes
        proposal.votes -= token.balanceOf(msg.sender);

        //track that the user has voted
        votes[msg.sender][_id] = true;
        //emit an event
        emit Voted(_id, proposal.votes, msg.sender);
    }

    function finalizeProposal(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];
        require(!proposal.finalized, 'proposal already finalized');
        require(proposal.votes >= quorum, 'cannot finalize proposal, not enough votes');
        require(address(this).balance >= proposal.amount, 'cannot finalize proposal, not enough funds');
        proposal.finalized = true;
        (bool sent, ) = proposal.recipient.call{value: proposal.amount}('');
        require(sent, 'failed to send ether');
        emit Finalize(_id);
        }


}
