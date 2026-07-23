
const algosdk = require('algosdk');

// Write functions to do the following,
// 1. Create the necessary transactions for deploying and transacting FT
const getPaymentTxn = async (algodClient, from, to, assetId, amount) => {
    const suggestedParams = await algodClient.getTransactionParams().do();
  
    return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to,
      assetIndex: assetId,
      amount,
      suggestedParams,
    });
  };
  

  const signAndSubmit = async (algodClient, txns, signer) => {
    // used by backend to sign and submit txns
    const groupedTxns = algosdk.assignGroupID(txns);
  
    const signedTxns = groupedTxns.map((txn) => txn.signTxn(signer.sk));
  
    const response = await algodClient.sendRawTransaction(signedTxns).do();
  
    const confirmation = await algosdk.waitForConfirmation(algodClient, response.txId, 4);
  
    return {
      response,
      confirmation,
    };
  };
  

  
  const getAuthTxn = async (algodClient, accountAddress) => {
    // Zero-ALGO self-payment used only to prove control of accountAddress via signature.
    // No asset opt-in required, unlike a zero-amount ASA transfer.
    const suggestedParams = await algodClient.getTransactionParams().do();

    return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: accountAddress,
      to: accountAddress,
      amount: 0,
      suggestedParams,
    });
  };

  const getAssetOptInTxn = async (algodClient, accAddr, assetId) => {
    const suggestedParams = await algodClient.getTransactionParams().do();
  
    return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: accAddr,
      to: accAddr,
      assetIndex: assetId,
      suggestedParams,
    });
  };


  const totalSupply = async function (algodClient, accAddr, assetId) {
    let total_supply
    let accountInfo = await algodClient.accountInformation(accAddr).do();
    for (idx = 0; idx < accountInfo['created-assets'].length; idx++) {
      let scrutinizedAsset = accountInfo['created-assets'][idx];
      if (scrutinizedAsset['index'] == assetId) {
        total_supply = scrutinizedAsset['params']['total'];
        console.log(total_supply)
        break;
      }
    }
    return {
      total_supply
    };
  };

  const balanceOf = async function (algodClient, accAddr, assetId) {
    let balance;
    let accountInfo = await algodClient.accountInformation(accAddr).do();
    for (idx = 0; idx < accountInfo['assets'].length; idx++) {
      let scrutinizedAsset = accountInfo['assets'][idx];
      if (scrutinizedAsset['asset-id'] == assetId) {
        balance = scrutinizedAsset['amount'];
        console.log(balance)
        break;
      }
    }
    return {
      balance
    };
  };
 
  
module.exports  = { getPaymentTxn, getAuthTxn, signAndSubmit, getAssetOptInTxn,totalSupply,balanceOf};
