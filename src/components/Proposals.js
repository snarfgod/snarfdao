import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { ethers } from 'ethers';
import { useState } from 'react';

const Proposals = ({ provider, dao, proposals, quorum, setIsLoading }) => {
  const [signer] = useState(provider.getSigner().getAddress())

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
          <th>Recipient Address</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Total Votes</th>
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
            <td>{proposal.recipient}</td>
            <td>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</td>
            <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
            <td>{proposal.votes.toString()}</td>
            <td>
              {!proposal.finalized && !proposal.votes[signer][proposal.id] && (
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  onClick={() => voteHandler(proposal.id)}
                >
                  Vote
                </Button>
              )}
            </td>
            <td>
              {!proposal.finalized && proposal.votes > quorum && !proposal.votes[signer][proposal.id] && (
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
