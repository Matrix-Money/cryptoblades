const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const CryptoBlades = artifacts.require("CryptoBlades");
const Blacksmith = artifacts.require("Blacksmith");
const Weapons = artifacts.require("Weapons");
const ChainlinkRandoms = artifacts.require("ChainlinkRandoms");
const DummyRandoms = artifacts.require("DummyRandoms");
const NFTMarket = artifacts.require("NFTMarket");
const BasicPriceOracle = artifacts.require("BasicPriceOracle");
const Raid1 = artifacts.require("Raid1");
const CharacterFireTraitChangeConsumables = artifacts.require("CharacterFireTraitChangeConsumables");
const CharacterEarthTraitChangeConsumables = artifacts.require("CharacterEarthTraitChangeConsumables");
const CharacterWaterTraitChangeConsumables = artifacts.require("CharacterWaterTraitChangeConsumables");
const CharacterLightningTraitChangeConsumables = artifacts.require("CharacterLightningTraitChangeConsumables");

module.exports = async function (deployer, network, accounts) {
  const game = await upgradeProxy(CryptoBlades.address, CryptoBlades, { deployer });
  await upgradeProxy(Weapons.address, Weapons, { deployer });
  const blacksmith = await upgradeProxy(Blacksmith.address, Blacksmith, { deployer });
  const market = await upgradeProxy(NFTMarket.address, NFTMarket, { deployer });
  const priceOracle = await BasicPriceOracle.deployed();
  await market.migrateTo_2316231(priceOracle.address);
  await upgradeProxy(Raid1.address, Raid1, { deployer });
  await upgradeProxy(CharacterFireTraitChangeConsumables.address, CharacterFireTraitChangeConsumables, { deployer });
  await upgradeProxy(CharacterEarthTraitChangeConsumables.address, CharacterEarthTraitChangeConsumables, { deployer });
  await upgradeProxy(CharacterWaterTraitChangeConsumables.address, CharacterWaterTraitChangeConsumables, { deployer });
  await upgradeProxy(CharacterLightningTraitChangeConsumables.address, CharacterLightningTraitChangeConsumables, { deployer });

  if (network === 'development' || network === 'development-fork') {
    await upgradeProxy(DummyRandoms.address, DummyRandoms, { deployer });
  }
  else if (network === 'bsctestnet' || network === 'bsctestnet-fork' || network === 'bscmainnet' || network === 'bscmainnet-fork' || network === 'hecotestnet' || network === 'hecomainnet' || network === 'okexmainnet' || network === 'okextestnet' || network === 'polygonmainnet' || network === 'avaxmainnet' || network === 'auroramainnet' || network === 'skalemainnet' || network === 'kavamainnet' || network === 'polygontestnet' || network === 'avaxtestnet' || network === 'avaxtestnet-fork' || network === 'auroratestnet' || network === 'kavatestnet' || network === 'skaletestnet') {
    let openZeppelinRelayerAddress, linkToken, vrfCoordinator, keyHash, fee;
    if (network === 'bsctestnet' || network === 'bsctestnet-fork' || network === 'hecotestnet' || network === 'okextestnet' || network === 'polygontestnet' || network === 'avaxtestnet' || network === 'avaxtestnet-fork' || network === 'auroratestnet' || network === 'kavatestnet' || network === 'skaletestnet') {
      openZeppelinRelayerAddress = '0x6c0ca2a5f6ef7d33f18ac8abb285466279bd7917';

      linkToken = '0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06';
      vrfCoordinator = '0xa555fC018435bef5A13C6c6870a9d4C11DEC329C';
      keyHash = '0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186';
      fee = web3.utils.toWei('0.1', 'ether');
    }
    else if (network === 'bscmainnet' || network === 'bscmainnet-fork') {
      openZeppelinRelayerAddress = '0x7aafaacafb9ba78fd76d4c5b55c3d2f67e5e81d4';

      linkToken = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
      vrfCoordinator = '0x747973a5A2a4Ae1D3a8fDF5479f1514F65Db9C31';
      keyHash = '0xc251acd21ec4fb7f31bb8868288bfdbaeb4fbfec2df3735ddbd4f7dc8d60103c';
      fee = web3.utils.toWei('0.2', 'ether');
    }
    else if(network === 'hecomainnet' || network === 'okexmainnet' || network === 'polygonmainnet' || network === 'avaxmainnet' || network === 'auroramainnet' || network === 'skalemainnet' || network === 'kavamainnet') {
      openZeppelinRelayerAddress = '0x0000000000000000000000000000000000000000';

      linkToken = '0x0000000000000000000000000000000000000000';
      vrfCoordinator = '0x0000000000000000000000000000000000000000';
      keyHash = '0x0000000000000000000000000000000000000000';
      fee = web3.utils.toWei('0.2', 'ether');
    }
    else assert.fail('Should never happen - but just in case');

    const oldRandoms = await ChainlinkRandoms.deployed();

    await deployer.deploy(ChainlinkRandoms, vrfCoordinator, linkToken, keyHash, fee);
    const randoms = await ChainlinkRandoms.deployed();

    await game.migrateRandoms(randoms.address);
    await blacksmith.migrateRandoms(randoms.address);

    if(!await oldRandoms.paused()) {
      await oldRandoms.pause();
    }
  }
};
