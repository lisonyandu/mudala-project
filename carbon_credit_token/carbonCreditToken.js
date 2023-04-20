const algosdk = require('algosdk');
// require('dotenv').config();
// Retrieve the token, server and port values for your installation in the 
// algod.net and algod.token files within the data directory

// sandbox
const token = { 'X-API-Key': process.env.TESTNET_ALGOD_API_KEY }; // for local environment use const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const server = process.env.TESTNET_ALGOD_SERVER; //for local environment use 'http://localhost', for TestNet use PureStake "https://testnet-algorand.api.purestake.io/ps2" or AlgoExplorer "https://api.testnet.algoexplorer.io",
const port = process.env.TESTNET_ALGOD_PORT; // for local environment use 4001;
// // sandbox
// const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
// const server = "http://localhost";
// const port = 4001;

let algodclient = new algosdk.Algodv2(token, server, port);

var account1_mnemonic = "mesh enemy swarm oyster same foil kangaroo across biology inflict remain electric angry destroy office solid parade labor place vital link coil flavor abstract convince";
var account2_mnemonic = "renew census border ethics fragile photo amused alone risk shop exercise aware slide chunk illness slide valid joy album culture evolve moral pretty about fantasy";
var account3_mnemonic = "busy zebra follow brand fire victory honey addict simple spot final garbage young critic monitor buffalo muffin sting hour ticket aunt elbow slow absorb pipe";
var account4_mnemonic = "proud decade wheat audit verify year inquiry nothing legal human galaxy turkey brown index leaf ride runway inch fresh fury order twist couple abandon shell";

var regulator_pk = algosdk.mnemonicToSecretKey(account1_mnemonic);
var seller_pk = algosdk.mnemonicToSecretKey(account2_mnemonic);
var buyer_pk = algosdk.mnemonicToSecretKey(account3_mnemonic);
var vendor_pk = algosdk.mnemonicToSecretKey(account4_mnemonic);

const regulator_address = regulator_pk.addr;
const seller_address = seller_pk.addr;
const buyer_address = buyer_pk.addr;
const vendor_address = vendor_pk.addr;


// Debug Console should look similar to this

async function createCarbonCreditToken(regulator_pk) {
  let params = await algodclient.getTransactionParams().do();
  console.log(params);
  let note = undefined; // arbitrary data to be stored in the transaction; here, none is stored
  let assetID = null;
  let addr = regulator_pk.addr;
  // Whether user accounts will need to be unfrozen before transacting    
  let defaultFrozen = false;
  // integer number of decimals for asset unit calculation
  let decimals = 2;
  // total number of this asset available for circulation   
  let totalIssuance = 1000;
  // Used to display asset units to user    
  let unitName = "CCT";
  // Friendly name of the asset    
  let assetName = "CarbonCreditToken";
  // Optional string pointing to a URL relating to the asset
  let assetURL = "http://localhost:8080/";
  // Optional hash commitment of some sort relating to the asset. 32 character length.
  let assetMetadataHash = "16efaa3924a6fd9d3a4824799a4ac65d";
  let manager = regulator_pk.addr;
  // Specified address is considered the asset reserve
  // (it has no special privileges, this is only informational)
  let reserve = regulator_pk.addr;
  // Specified address can freeze or unfreeze user asset holdings 
  let freeze = regulator_pk.addr;
  // Specified address can revoke user asset holdings and send 
  // them to other addresses    
  let clawback = regulator_pk.addr;

  // signing and sending "txn" allows "addr" to create an asset
  let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
    addr, 
    note,
    totalIssuance, 
    decimals, 
    defaultFrozen, 
    manager, 
    reserve, 
    freeze,
    clawback, 
    unitName, 
    assetName, 
    assetURL, 
    assetMetadataHash, 
    params
  );

  let rawSignedTxn = txn.signTxn(regulator_pk.sk)
  let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

  // wait for transaction to be confirmed
  const ptx = await algosdk.waitForConfirmation(algodclient, tx.txId, 100 );
  // Get the new asset's information from the creator account
  // let ptx = await algodclient.pendingTransactionByAddress(regulator_pk.addr).do();
  assetID = ptx["asset-index"];

  // Print created asset information
  totalSupply(algodclient, regulator_pk.addr, assetID);
  balanceOf(algodclient, regulator_pk.addr, assetID);
  return {
    assetID
  }
}
// createCarbonCreditToken(regulator_pk)

// Function used to print created asset  total supply for account and assetid
const totalSupply = async function (algodclient, account, assetid) {
  let total_supply
  let accountInfo = await algodclient.accountInformation(account).do();
  for (idx = 0; idx < accountInfo['created-assets'].length; idx++) {
    let scrutinizedAsset = accountInfo['created-assets'][idx];
    if (scrutinizedAsset['index'] == assetid) {
      total_supply = scrutinizedAsset['params']['total'];
      console.log(total_supply)
      break;
    }
  }
  return {
    total_supply
  };
};

// Function used to print created asset balance for account and assetid
const balanceOf = async function (algodclient, account, assetid) {
  let balance;
  let accountInfo = await algodclient.accountInformation(account).do();
  for (idx = 0; idx < accountInfo['assets'].length; idx++) {
    let scrutinizedAsset = accountInfo['assets'][idx];
    if (scrutinizedAsset['asset-id'] == assetid) {
      balance = scrutinizedAsset['amount'];
      console.log(balance)
      break;
    }
  }
  return {
    balance
  };
};

balanceOf(algodclient, buyer_address, 166644084)
totalSupply(algodclient, buyer_address, 166644084)
module.exports = {
  createCarbonCreditToken,
  balanceOf,
  totalSupply
};

