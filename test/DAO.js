const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {

    let token, dao, accounts, deployer, funder

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    funder = accounts[1]

    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('Snarfcoin', 'SNARF', '1000000')

    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address, '500000000000000000000001')

    //Funding the treasury for governance
    await funder.sendTransaction({
        to: dao.address,
        value: ether(100)
    })
    })

  describe('Deployment', () => {

    it('returns the token address', async () => {
        expect(await dao.token()).to.equal(token.address)
    })
    it('returns the quorum', async () => {
        expect(await dao.quorum()).to.equal('500000000000000000000001')
    })
    it('sends ether to DAO treasury', async () => {
        expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100))
    })
  })
})

