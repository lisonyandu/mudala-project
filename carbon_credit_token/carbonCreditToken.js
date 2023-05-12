const algosdk = require('algosdk');
// require('dotenv').config();
// Retrieve the token, server and port values for your installation in the 
// algod.net and algod.token files within the data directory

// sandbox
// const token = { 'X-API-Key': process.env.TESTNET_ALGOD_API_KEY }; // for local environment use const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
// const server = process.env.TESTNET_ALGOD_SERVER; //for local environment use 'http://localhost', for TestNet use PureStake "https://testnet-algorand.api.purestake.io/ps2" or AlgoExplorer "https://api.testnet.algoexplorer.io",
// const port = process.env.TESTNET_ALGOD_PORT; // for local environment use 4001;
// // sandbox
const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const server = "http://localhost";
const port = 4001;
const assetID = 166644084;
let algodclient = new algosdk.Algodv2(token, server, port);

var account1_mnemonic = "mesh enemy swarm oyster same foil kangaroo across biology inflict remain electric angry destroy office solid parade labor place vital link coil flavor abstract convince";
var account2_mnemonic = "renew census border ethics fragile photo amused alone risk shop exercise aware slide chunk illness slide valid joy album culture evolve moral pretty about fantasy";
var account3_mnemonic = "busy zebra follow brand fire victory honey addict simple spot final garbage young critic monitor buffalo muffin sting hour ticket aunt elbow slow absorb pipe";
var account4_mnemonic = "proud decade wheat audit verify year inquiry nothing legal human galaxy turkey brown index leaf ride runway inch fresh fury order twist couple abandon shell";
var account5_mnemonic = "amount miracle blanket green afford age employ shoot spare column cereal aerobic bless luxury position uncle flat crazy sure myth link gesture power about manual";

var regulator_pk = algosdk.mnemonicToSecretKey(account1_mnemonic);
var seller_pk = algosdk.mnemonicToSecretKey(account2_mnemonic);
var buyer_pk = algosdk.mnemonicToSecretKey(account3_mnemonic);
var vendor_pk = algosdk.mnemonicToSecretKey(account4_mnemonic);
var regulator_2_pk = algosdk.mnemonicToSecretKey(account5_mnemonic);

const regulator_address = regulator_pk.addr;
const seller_address = seller_pk.addr;
const buyer_address = buyer_pk.addr;
const vendor_address = vendor_pk.addr;
const regulator_2_address = regulator_2_pk.addr;


// Debug Console should look similar to this

async function createCarbonCreditToken(regulator_2_pk) {
  let params = await algodclient.getTransactionParams().do();
  console.log(params);
  let note = undefined; // arbitrary data to be stored in the transaction; here, none is stored
  let assetID = null;
  let addr = regulator_2_pk.addr;
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
  let manager = regulator_2_pk.addr;
  // Specified address is considered the asset reserve
  // (it has no special privileges, this is only informational)
  let reserve = regulator_2_pk.addr;
  // Specified address can freeze or unfreeze user asset holdings 
  let freeze = regulator_2_pk.addr;
  // Specified address can revoke user asset holdings and send 
  // them to other addresses    
  let clawback = regulator_2_pk.addr;

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

  let rawSignedTxn = txn.signTxn(regulator_2_pk.sk)
  let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

  // wait for transaction to be confirmed
  const ptx = await algosdk.waitForConfirmation(algodclient, tx.txId, 100 );
  // Get the new asset's information from the creator account
  // let ptx = await algodclient.pendingTransactionByAddress(regulator_pk.addr).do();
  assetID = ptx["asset-index"];
  console.log("New Asset ID:",assetID)
  // Print created asset information
  totalSupply(algodclient, regulator_2_pk.addr, assetID);
  balanceOf(algodclient, regulator_2_pk.addr, assetID);
  return {
    assetID
  }
}
// request tokens
// createCarbonCreditToken(regulator_2_pk)

async function transferCredits(algodclient, seller_address, amount) {

    // opt-in to asset
  await optInAsset('seller');
  console.log('Opted in');

  const sender = regulator_address;
  const recipient = seller_address;
  const note = undefined;
  const revocationTarget = undefined;
  const closeRemainderTo = undefined;
  // const fee = 10;

  // check if regulator has enough credits to transfer
  // const regulatorBalance = await getTokenBalance(algodclient, sender, assetID);
  const val = await balanceOf(algodclient, regulator_address, assetID);

  console.log('Regulator balance:', val.balance);
  if (amount > val.balance) {
    console.log(`Regulator has insufficient credits to transfer.`);
    return;
  }

  // get transaction parameters
  const params = await algodclient.getTransactionParams().do();
  // const amount = 100; // transfer 100 credits
  console.log(`Transferring ${amount} credits to ${recipient}...`);

  // create asset transfer transaction with specified amount
  const xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender, 
    recipient, 
    closeRemainderTo, 
    revocationTarget,
    BigInt(amount),  
    note, 
    assetID, 
    params
  );

  // Must be signed by the account sending the asset  
  console.log('Signing transaction with regulator private key...');
  const rawSignedTxn = xtxn.signTxn(regulator_pk.sk);
  console.log('Sending transaction to the network...');
  const xtx = await algodclient.sendRawTransaction(rawSignedTxn).do();
  console.log(`Token transfer transaction ID: ${xtx.txId}`);

  // Wait for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);

  //Get the completed Transaction
  console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
  console.log(`Regulator has successfully transferred ${amount} credits to ${recipient}`);
}

// requestTokens();

// // set up marketplace balance
// let marketBalance = 0;
// const tokensPerAlgo = 100;
// (async () => {

//   let params = await algodclient.getTransactionParams().do();

//   let amount = Math.floor(Math.random() * 1000);
//   // let amount = 1;
//   var mnemonic = "code thrive mouse code badge example pride stereo sell viable adjust planet text close erupt embrace nature upon february weekend humble surprise shrug absorb faint";
//   var recoveredAccount = algosdk.mnemonicToSecretKey(mnemonic);
//   // U2VHSZL3LNGATL3IBCXFCPBTYSXYZBW2J4OGMPLTA4NA2CB4PR7AW7C77E
//   let txn = {
//       "from": vendor_pk.addr,
//       "to": regulator_address,
//       "fee": 1,
//       "amount": amount,
//       "firstRound": params.firstRound,
//       "lastRound": params.lastRound,
//       "genesisID": params.genesisID,
//       "genesisHash": params.genesisHash,
//       "note": undefined,
//       "assetID": assetID
//   };

//   let signedTxn = algosdk.signTransaction(txn, vendor_pk.sk);
//   let sendTx = await algodclient.sendRawTransaction(signedTxn.blob).do();

//   console.log("Transaction : " + sendTx.txId);
// })().catch(e => {
//   console.log(e);
// });

async function mintTokens(amount) {

  let params = await algodclient.getTransactionParams().do();
  
  let txn = {
    "from": regulator_2_address,
    "to": regulator_address,
    "fee": 1,
    "amount": BigInt(amount),
    "firstRound": params.firstRound,
    "lastRound": params.lastRound,
    "genesisID": params.genesisID,
    "genesisHash": params.genesisHash,
    "note": undefined,
    "assetID": 211374650
};

let signedTxn = algosdk.signTransaction(txn, regulator_2_pk.sk);
let sendTx = await algodclient.sendRawTransaction(signedTxn.blob).do();
console.log("Transaction : " + sendTx.txId);
const confirmedTxn = await algosdk.waitForConfirmation(algodclient, sendTx.txId, 4);

console.log("Regulator has minted " + sendTx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
return{
  amount
}


}


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

// OPT IN RECEIVE ASSET BY USER TYPE
async function optInAsset(userType) {
  let sender;
  let recipient;
  let note;
  
  if (userType === 'buyer') {
    sender = buyer_address;
    recipient = sender;
  } else if (userType === 'seller') {
    sender = seller_address;
    recipient = sender;
  } else if (userType === 'vendor') {
    sender = vendor_address;
    recipient = sender;
  } else {
    console.log('Invalid user type. Please enter "buyer" or "seller" or "vendor".');
    return;
  }

  const revocationTarget = undefined;
  const closeRemainderTo = undefined;
  const amount = 0;
  const params = await algodclient.getTransactionParams().do();
  const opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender, 
    recipient, 
    closeRemainderTo, 
    revocationTarget,
    amount, 
    note, 
    assetID, 
    params
  );

  const privateKey = userType === 'seller' ? seller_pk.sk : userType === 'buyer' ? buyer_pk.sk : vendor_pk.sk;
  const rawSignedTxn = opttxn.signTxn(privateKey);
  const opttx = await algodclient.sendRawTransaction(rawSignedTxn).do();
  const confirmedTxn = await algosdk.waitForConfirmation(algodclient, opttx.txId, 4);

  console.log("Transaction " + opttx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

  console.log(`Address: ${sender} has successfully opted in to receive asset with ID: ${assetID}`);
}

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
totalSupply(algodclient, regulator_address, 166644084)
// mintTokens()
module.exports = {
  createCarbonCreditToken,
  balanceOf,
  totalSupply,
  transferCredits,
  optInAsset,
  mintTokens
};

