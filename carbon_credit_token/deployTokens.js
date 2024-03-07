require('dotenv').config({ path: "C:/Users/User/Desktop/mudala-back-end/.env.local" });
const getAlgodClient = require("C:/Users/User/Desktop/mudala-back-end/clients/index.js");
const algosdk = require('algosdk');
const algotxns = require("C:/Users/User/Desktop/mudala-back-end/algorand/index.js");

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient.getAlgodClient(network);


// get creator account
const regulator = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC);
// const reg_addr = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_ADDR);
const regulator_2 = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC_2);
const buyer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_BUYER_MNEMONIC);
// const seller_addr = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_SELLER_ADDR);
const seller = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_SELLER_MNEMONIC);



let assetId ;
// const assetId = parseInt(process.env.NEXT_PUBLIC_FT_ASSET_ID);

// PART 1: CREATE MY TOKEN 
const createCarbonCreditToken = async () => {

  const suggestedParams = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: regulator.addr,
    suggestedParams,
    defaultFrozen: false,
    unitName: 'CCT',
    assetName: 'CarbonCreditToken',
    manager: regulator.addr,
    reserve: regulator_2.addr,
    freeze: regulator.addr,
    clawback: regulator.addr,
    assetURL: 'http://localhost:8080/"',
    total: 10000000,
    decimals: 2,
  });
  
  // Must be signed by the account sending the asset 
  const rawSignedTxn = txn.signTxn(regulator.sk);
  console.log('Sending transaction to the network...create asset');
  const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  // Wait for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);
  //Get the completed Transaction
  console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
  // PRINT ASSET ID
  const assetId = confirmedTxn['asset-index'];
  // console.log(`Asset ID created: ${assetId}`);
  return assetId;
  }

// OPT IN TO RECEIVE TOKENS
const optIn = async () => {

  const xtxn = await algotxns.getAssetOptInTxn(algodClient,buyer.addr,assetId)
  // Must be signed by the account sending the asset  
  const rawSignedTxn = xtxn.signTxn(buyer.sk);
  console.log('Sending transaction to the network...opt in');
  const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  // Wait for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);
  //Get the completed Transaction
  console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

}


// PART 1: SEND 100 TOKENS
const trasferToken = async () => {

  const xtxn = await algotxns.getPaymentTxn(algodClient, regulator.addr, seller, assetId, amount)
  // Must be signed by the account sending the asset  
  const rawSignedTxn = xtxn.signTxn(regulator.sk);
  console.log('Sending transaction to the network...sending 100 algos');
  const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
  // Wait for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);
  //Get the completed Transaction
  console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
}

// MAIN async function
(async () => {
  // write your code here
// Run to reate a Token
// assetId = await createCarbonCreditToken(); 

// Run to optIn
// await optIn() 

// Run to transfer tokens
// await trasferToken()
await mintTokens()

// Print asset ID
// console.log(`Asset ID created: ${assetId}`);
})();

module.exports = {
  createCarbonCreditToken,
  mintTokens
};
