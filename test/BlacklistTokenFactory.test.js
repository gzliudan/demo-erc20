// SPDX-License-Identifier: MIT

/* global describe context it ethers */

// ==================== External Imports ====================

const chai = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

// ==================== Internal Imports ====================

const { expect } = chai;

const { keccak256 } = require('./helpers/hash');

// const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'; //

const adminRole = keccak256('ADMIN_ROLE'); // 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775
const pauserRole = keccak256('PAUSER_ROLE'); // 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a
const minterRole = keccak256('MINTER_ROLE'); // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6

describe('contract BlacklistTokenFactory', function () {
  const name = 'Demo Token';
  const symbol = 'DTK';
  const quantity = 1000000;
  const totalSupply = BigInt(quantity) * 10n ** 18n;

  async function getTokenAddress(txnHash) {
    if (!txnHash) {
      throw new Error('Invalid transaction hash');
    }

    const topic = keccak256('CreateBlacklistToken(address,address,string,string,uint256)');
    const logs = await ethers.provider.getLogs({
      fromBlock: 'latest',
      toBlock: 'latest',
      topics: [topic],
    });

    const abi = ['event CreateBlacklistToken(address indexed creater, address indexed token, string name, string symbol, uint256 quantity)'];

    const interface = new ethers.utils.Interface(abi);
    const lastLog = interface.parseLog(logs[logs.length - 1]);

    return lastLog.args.token;
  }

  async function deployFactoryFixture() {
    const [owner, caller] = await ethers.getSigners();
    const factoryContract = await ethers.getContractFactory('BlacklistTokenFactory');
    const factory = await factoryContract.deploy();
    await factory.deployed();

    const promise = factory.connect(caller).createBlacklistToken(name, symbol, quantity);
    const tokenAddress = await getTokenAddress((await promise).hash);
    const tokenContract = await ethers.getContractFactory('BlacklistToken');
    const token = await tokenContract.attach(tokenAddress);

    return { owner, caller, factory, promise, token };
  }

  context('function createBlacklistToken', async () => {
    it(`should emit event CreateBlacklistToken`, async () => {
      const { factory, caller, promise, token } = await loadFixture(deployFactoryFixture);
      await expect(promise).emit(factory, 'CreateBlacklistToken').withArgs(caller.address, token.address, name, symbol, quantity);
    });

    it(`should save token address`, async () => {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(token.address).eq(await factory.blacklistTokens(0));
    });

    it(`should has right name and symbol`, async () => {
      const { token } = await loadFixture(deployFactoryFixture);
      expect(await token.name()).eq(name);
      expect(await token.symbol()).eq(symbol);
    });

    it(`should has right total supply`, async () => {
      const { token } = await loadFixture(deployFactoryFixture);
      expect(await token.totalSupply()).eq(totalSupply);
    });

    it(`should mint correct tokens to caller`, async () => {
      const { caller, token } = await loadFixture(deployFactoryFixture);
      const balance = await token.balanceOf(caller.address);
      expect(balance).eq(totalSupply);
    });

    it(`should not mint tokens to factory`, async () => {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      const balance = await token.balanceOf(factory.address);
      expect(balance).eq(0n);
    });

    it(`should grant correct roles to caller`, async () => {
      const { caller, token } = await loadFixture(deployFactoryFixture);
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, caller.address)).is.true;
      expect(await token.hasRole(adminRole, caller.address)).is.true;
      expect(await token.hasRole(pauserRole, caller.address)).is.true;
      expect(await token.hasRole(minterRole, caller.address)).is.true;
    });

    it(`should not grant roles to factory`, async () => {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, factory.address)).is.false;
      expect(await token.hasRole(adminRole, factory.address)).is.false;
      expect(await token.hasRole(pauserRole, factory.address)).is.false;
      expect(await token.hasRole(minterRole, factory.address)).is.false;
    });
  });
});
