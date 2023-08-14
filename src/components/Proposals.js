import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';


const Proposals = ({ provider, dao, proposals, quorum, account, setIsLoading }) => {

  const [recipientBalances, setRecipientBalances] = useState({});
  const [votedProposals, setVotedProposals] = useState([]);

  useEffect(() => {
    async function fetchRecipientBalances() {
      const balances = {};
      for (const proposal of proposals) {
        const balance = await getFormattedRecipientBalance(proposal.recipient);
        balances[proposal.recipient] = balance;
      }
      setRecipientBalances(balances);
    }
    fetchRecipientBalances();
  }, [proposals]);

  useEffect(() => {
    fetchVotedProposals();
  }, [account, dao, proposals]);
  
  

  const fetchVotedProposals = async () => {
    try {
      const voted = [];
      for (const proposal of proposals) {
        if (await dao.voted(account, proposal.id)) {
          voted.push(proposal.id);
        }
      }
      setVotedProposals(voted);
    } catch (error) {
      console.error('Error fetching voted proposals:', error);
    }
  };  

  const getFormattedRecipientBalance = async (recipientAddress) => {
    try {
      const balance = await provider.getBalance(recipientAddress);
      return ethers.utils.formatUnits(balance, "ether") + " ETH";
    } catch (error) {
      console.error('Error fetching recipient balance:', error);
      return 'N/A'; // Return a default value in case of error
    }
  };

  const voteHandler = async (id) => {
    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).vote(id)
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }
  
  const downVoteHandler = async (id) => {
    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).downVote(id)
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  const finalizeHandler = async (id) => {
    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).finalizeProposal(id)
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Description</th>
          <th>Recipient Address & Balance</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Total Votes Cast</th>
          <th>Ratio For/Against</th>
          <th>Cast Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
          <tr key={index}>
            <td>{proposal.id.toString()}</td>
            <td>{proposal.name}</td>
            <td>{proposal.description}</td>
            <td>{proposal.recipient + `\n` + recipientBalances[proposal.recipient]}</td>
            <td>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</td>
            <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
            <td>{ethers.utils.formatUnits(proposal.votes, 18)}</td>
            <td>{ethers.utils.formatUnits(proposal.upVotes, 18)}/{ethers.utils.formatUnits(proposal.downVotes, 18)}</td>
            <td>
              {!proposal.finalized && !votedProposals.includes(proposal.id) && (
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  onClick={() => voteHandler(proposal.id)}
                >
                  Vote For
                </Button>
              )}
              {!proposal.finalized && !votedProposals.includes(proposal.id) && (
                <Button
                  variant="primary"
                  style={{ width: '100%' , marginTop: '10px'}}
                  onClick={() => downVoteHandler(proposal.id)}
                >
                  Vote Against
                </Button>
              )}
            </td>
            <td>
              {!proposal.finalized && proposal.upVotes > quorum && (
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  onClick={() => finalizeHandler(proposal.id)}
                >
                  Finalize
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default Proposals;
