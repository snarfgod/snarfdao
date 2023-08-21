const { expect } = require('chai');
const { ethers } = require('hardhat');


const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {

    let usdc, token, dao, accounts, deployer, funder, investor1, investor2, investor3, investor4, investor5, recipient, user, proposalAmount

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    funder = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]
    investor3 = accounts[4]
    investor4 = accounts[5]
    investor5 = accounts[6]
    recipient = accounts[7]
    user = accounts[8]
    proposalAmount = tokens(100, 6)

    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('Snarfcoin', 'SNARF', '1000000')

    transaction = await token.connect(deployer).transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor3.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor4.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor5.address, tokens(200000))
    await transaction.wait()

   // Create mock USDC token using the custom MockERC20 contract
    const ERC20Factory = await ethers.getContractFactory('MockERC20');
    usdc = await ERC20Factory.deploy('USDC Stablecoin', 'USDC', 6, tokens(10000));
    await usdc.deployed();

    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address, usdc.address, '500000000000000000000001')
    await dao.deployed()

     // Fund the DAO with 1000 USDC
     transaction = await usdc.connect(deployer).transfer(dao.address, tokens(10000, 6));
     await transaction.wait();
    })

  describe('Deployment', () => {

    it('returns the token address', async () => {
        expect(await dao.token()).to.equal(token.address)
    })
    it('returns the quorum', async () => {
        expect(await dao.quorum()).to.equal('500000000000000000000001')
    })
    it('returns the usdc address', async () => {
        expect(await dao.usdc()).to.equal(usdc.address)
    })
    it('sends usdc to DAO treasury', async () => {
      expect(await usdc.balanceOf(dao.address)).to.equal(tokens(10000, 6)); // Use balanceOf
    });
  })

  describe('Proposal creation', () => {
    let transaction, result
    describe('Success', () => {
        beforeEach(async () => {
            transaction = await dao.connect(investor1).createProposal('Proposal 1', 'description', proposalAmount, recipient.address)
            result = await transaction.wait()
        })
        it('updates proposal count', async () => {
            expect(await dao.proposalCount()).to.equal(1)
        })
        it('updates mapping', async () => {
            const proposal = await dao.proposals(1)
            expect(proposal.id).to.equal(1)
            expect(proposal.name).to.equal('Proposal 1')
            expect(proposal.description).to.equal('description')
            expect(proposal.amount).to.equal(proposalAmount)
            expect(proposal.recipient).to.equal(recipient.address)
        })
        it('emits a ProposalCreated event', async () => {
            expect(transaction).to.emit(dao, 'Propose').withArgs(1, proposalAmount, recipient.address, investor1.address)
        })
    })
    describe('Failure', () => {
        it('rejects invalid amount', async () => {
            await expect(dao.connect(investor1).createProposal('Proposal 1', 'description', tokens(1000000000, 6), recipient.address)).to.be.reverted
        })
        it('rejects request to create proposal from non-investor', async () => {
            await expect(dao.connect(user).createProposal('Proposal 1', 'description', proposalAmount, recipient.address)).to.be.reverted
        })
    })

  })
  describe('Voting', () => {
    let transaction, result

    beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Proposal 1', 'description', proposalAmount, recipient.address)
        result = await transaction.wait()
    })
    describe('Success', () => {
        beforeEach(async () => {
            transaction = await dao.connect(investor1).vote(1)
            result = await transaction.wait()
        })
        it('updates vote count', async () => {
            const proposal = await dao.proposals(1)
            expect(proposal.votes).to.equal(tokens(200000))
        })
        it('updates upvote and downvote mappings', async() => {
          const upVoted = await dao.upVoted(investor1.address, 1)

          const transaction = await dao.connect(investor2).downVote(1)
          await transaction.wait()

          const downVoted = await dao.downVoted(investor2.address, 1)
          const voted = await dao.voted(investor2.address, 1)
          expect(voted).to.equal(true)

          expect(upVoted).to.equal(true)
          expect(downVoted).to.equal(true)
        })
        it('emits a correct vote event', async () => {
            expect(transaction).to.emit(dao, 'Vote').withArgs(1, tokens(200000), investor1.address)
        })
        it('downvotes', async () => {
          transaction = await dao.connect(investor2).downVote(1)
          await transaction.wait()
          const proposal = await dao.proposals(1)
          expect(proposal.votes).to.equal(tokens(400000))
          expect(await dao.downVoted(investor2.address, 1)).to.equal(true)
        })
        it('updates vote count after multiple votes', async() => {
          transaction = await dao.connect(investor2).vote(1)
          await transaction.wait()
          transaction = await dao.connect(investor3).downVote(1)
          await transaction.wait()
          const proposal = await dao.proposals(1)
          expect(proposal.votes).to.equal(tokens(600000))
        })
        it('emits a correct vote event upon downvote', async () => {
          transaction = await dao.connect(investor2).downVote(1)
          result = await transaction.wait()
          expect(transaction).to.emit(dao, 'Vote').withArgs(1, tokens(200000), investor2.address)
        })

    })
    describe('Failure', () => {
        it('rejects voting from non-investor', async () => {
          await expect(dao.connect(user).vote(1)).to.be.reverted
        })
        it('rejects double voting', async () => {
          transaction = await dao.connect(investor1).vote(1)
          await transaction.wait()
          await expect(dao.connect(investor1).vote(1)).to.be.reverted
          await expect(dao.connect(investor1).downVote(1)).to.be.reverted
        })
    })
  })
  describe('Governance', () => {
    let transaction, result

    describe('Success', () => {

      beforeEach(async () => {
        // Create proposal
        transaction = await dao.connect(investor1).createProposal('Proposal 1', 'description', proposalAmount, recipient.address)
        result = await transaction.wait()

        // Vote
        transaction = await dao.connect(investor1).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor3).vote(1)
        result = await transaction.wait()

        // Finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
      })

      it('transfers funds to recipient', async () => {
        expect(await usdc.balanceOf(recipient.address)).to.equal(proposalAmount)
      })

      it('it updates the proposal to finalized', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })

      it('emits a Finalize event', async () => {
        await expect(transaction).to.emit(dao, "Finalize")
          .withArgs(1)
      })

    })

    describe('Failure', () => {

      beforeEach(async () => {
        // Create proposal
        transaction = await dao.connect(investor1).createProposal('Proposal 1', 'description', proposalAmount, recipient.address)
        result = await transaction.wait()

        // Vote
        transaction = await dao.connect(investor1).vote(1)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1)
        result = await transaction.wait()
      })


      it('rejects finalization if not enough votes', async () => {
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
      })

      it('rejects finalization from a non-investor', async () => {
        // Vote 3
        transaction = await dao.connect(investor3).vote(1)
        result = await transaction.wait()

        await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted
      })

      it('rejects proposal if already finalized', async () => {
        // Vote 3
        transaction = await dao.connect(investor3).vote(1)
        result = await transaction.wait()

        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()

        // Try to finalize again
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
      })

    })
  })
})

