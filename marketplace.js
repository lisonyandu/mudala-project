const algosdk = require('algosdk');
// Retrieve the token, server and port values for your installation in the 
// algod.net and algod.token files within the data directory

// sandbox
const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const server = "http://localhost";
const port = 4001;


// Function used to print created asset for account and assetid
const printCreatedAsset = async function (algodclient, account, assetid) {

    let accountInfo = await algodclient.accountInformation(account).do();
    for (idx = 0; idx < accountInfo['created-assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['created-assets'][idx];
        if (scrutinizedAsset['index'] == assetid) {
            console.log("AssetID = " + scrutinizedAsset['index']);
            let myparms = JSON.stringify(scrutinizedAsset['params'], undefined, 2);
            console.log("parms = " + myparms);
            break;
        }
    }
};
// Function used to print asset holding for account and assetid
const printAssetHolding = async function (algodclient, account, assetid) {

    let accountInfo = await algodclient.accountInformation(account).do();
    for (idx = 0; idx < accountInfo['assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['assets'][idx];
        if (scrutinizedAsset['asset-id'] == assetid) {
            let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
            console.log("assetholdinginfo = " + myassetholding);
            break;
        }
    }
};


// Recover accounts
// paste in mnemonic phrases here for each account
// Shown for demonstration purposes. NEVER reveal secret mnemonics in practice.

var account1_mnemonic = "near gasp dinosaur genuine mother play festival nose despair accuse motor decade loyal able chief around bike suffer exile awkward capable roof you absorb sister";
var account2_mnemonic = "work print sadness fortune soup seminar elbow skull tomorrow reduce camera mom flip economy alpha require season disease day bench school skin lunar about shrimp";
var account3_mnemonic = "lizard bulk will shuffle wild bamboo public stage arrange trade carbon spring always dolphin can drastic thunder hover mind unlock airport gather stamp about can";

var vendor_address = algosdk.mnemonicToSecretKey(account1_mnemonic);
var seller_address = algosdk.mnemonicToSecretKey(account2_mnemonic);
var buyer_address = algosdk.mnemonicToSecretKey(account3_mnemonic);
console.log(vendor_address.addr);
console.log(seller_address.addr);
console.log(buyer_address.addr);

// Instantiate the algod wrapper

let algodclient = new algosdk.Algodv2(token, server, port);

// Debug Console should look similar to this

(async () => {
   
    let params = await algodclient.getTransactionParams().do();
    console.log(params);
    let note = undefined; // arbitrary data to be stored in the transaction; here, none is stored

    let addr = vendor_address.addr;
    // Whether user accounts will need to be unfrozen before transacting    
    let defaultFrozen = false;
    // integer number of decimals for asset unit calculation
    let decimals = 0;
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
    let manager = vendor_address.addr;
    // Specified address is considered the asset reserve
    // (it has no special privileges, this is only informational)
    let reserve = vendor_address.addr;
    // Specified address can freeze or unfreeze user asset holdings 
    let freeze = vendor_address.addr;
    // Specified address can revoke user asset holdings and send 
    // them to other addresses    
    let clawback = vendor_address.addr;

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
        params);

    let rawSignedTxn = txn.signTxn(vendor_address.sk)
    let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

    let assetID = null;
    // wait for transaction to be confirmed
    const ptx = await algosdk.waitForConfirmation(algodclient, tx.txId, 4);
    // Get the new asset's information from the creator account
    // let ptx = await algodclient.pendingTransactionInformation(tx.txId).do();
    assetID = ptx["asset-index"];
    //Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + ptx["confirmed-round"]);
    
   // console.log("AssetID = " + assetID);
    
    await printCreatedAsset(algodclient, vendor_address.addr, assetID);
    await printAssetHolding(algodclient, vendor_address.addr, assetID);
   
   // seller can view their token balance
async function viewTokenBalance() {
    const accountInfo = await algodclient.accountInformation(vendor_address.addr).do();
    const assets = accountInfo.assets;
    const tokenBalance = assets.find((asset) => asset['asset-id'] === assetID).amount;
    console.log(`Vendor Token balance: ${tokenBalance}`);
  }

await viewTokenBalance(algodclient, vendor_address.addr);

  //// OPT IN RECEIVE

    params = await algodclient.getTransactionParams().do();
    let sender = buyer_address.addr;
    let recipient = sender;
    // We set revocationTarget to undefined as 
    // This is not a clawback operation
    let revocationTarget = undefined;
    // CloseReaminerTo is set to undefined as
    // we are not closing out an asset
    let closeRemainderTo = undefined;
    // We are sending 0 assets
    amount = 0;


    // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
    let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount, 
        note, 
        assetID, 
        params);

    // Must be signed by the account wishing to opt in to the asset    
    rawSignedTxn = opttxn.signTxn(buyer_address.sk);
    let opttx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
    // Wait for confirmation
    confirmedTxn = await algosdk.waitForConfirmation(algodclient, opttx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + opttx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    //You should now see the new asset listed in the account information
    console.log("buyer_address = " + buyer_address.addr);
    await printAssetHolding(algodclient, buyer_address.addr, assetID);


  // TRANSFER

    // Transfer New Asset:
    params = await algodclient.getTransactionParams().do();
    sender = vendor_address.addr;
    recipient = buyer_address.addr;
    revocationTarget = undefined;
    closeRemainderTo = undefined;
    //Amount of the asset to transfer
    amount = 10;

    // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
    let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount,  
        note, 
        assetID, 
        params);
    // Must be signed by the account sending the asset  
    rawSignedTxn = xtxn.signTxn(vendor_address.sk)
    let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

    // Wait for confirmation
    confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // You should now see the 10 assets listed in the account information
    console.log("buyer_address = " + buyer_address.addr);
    await printAssetHolding(algodclient, buyer_address.addr);


// seller can request additional tokens from the validator
async function requestAdditionalTokens(algodclient) {
    params = await algodclient.getTransactionParams().do();
    // const genesisHash = params.genesisHash
    const vendor = vendor_address.addr;
    const seller = buyer_address.addr;
    const suggestedFeePerByte = 10;
    const amount = 10; // number of tokens to request
    const note = algosdk.encodeObj({ message: "Token request from seller" });
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParams({
      from:vendor,
      to:seller,
      amount,
    //   assetIndex: assetID,
      suggestedFeePerByte,
      note,
    }, params);
    rawSignedTxn = assetTransferTxn.signTxn(vendor_address.sk)
    let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

    // Wait for confirmation
    confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // You should now see the 10 assets listed in the account information
    console.log("buyer_address = " + buyer_address.addr);
    await printAssetHolding(algodclient, buyer_address.addr);
  }
  await requestAdditionalTokens(algodclient);

//  get seller's token balance
  (async function() {
    const accountInfo = await algodClient.accountInformation(sellerAddress);
    const tokenHolding = accountInfo.assets.find(asset => asset.assetid === tokenId);
    console.log(`Seller's token balance: ${tokenHolding.amount}`);

    // sell tokens to marketplace
    const sellTx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sellerAddress,
      to: validatorAddress,
      amount: 1000, // number of tokens to sell
      assetIndex: tokenId,
      suggestedParams: await algodClient.getTransactionParams(),
    });
    const sellTxId = algosdk.signAndSendTransaction(sellTx, sellerAccount.sk);
    console.log(`Seller sells 1000 tokens. Transaction ID: ${sellTxId}`);

    // get updated seller's token balance
    const updatedAccountInfo = await algodClient.accountInformation(sellerAddress);
    const updatedTokenHolding = updatedAccountInfo.assets.find(asset => asset.assetid === tokenId);
    console.log(`Seller's updated token balance: ${updatedTokenHolding.amount}`);

    // get marketplace's token balance
    const marketplaceInfo = await algodClient.accountInformation(validatorAddress);
    const marketplaceTokenHolding = marketplaceInfo.assets.find(asset => asset.assetid === tokenId);
    console.log(`Marketplace's token balance: ${marketplaceTokenHolding.amount}`);

    // buy tokens from marketplace
    const buyTx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: validatorAddress,
      to: buyerAddress,
      amount: 500, // number of tokens to buy
      assetIndex: tokenId,
      suggestedParams: await algodClient.getTransactionParams(),
    });
    const buyTxId = algosdk.signAndSendTransaction(buyTx, buyerAccount.sk);
    console.log(`Buyer buys 500 tokens. Transaction ID: ${buyTxId}`);

    // get updated buyer's token balance
    const updatedBuyerAccountInfo = await algodClient.accountInformation(buyerAddress);
    const updatedBuyerTokenHolding = updatedBuyerAccountInfo.assets.find(asset => asset.assetid === tokenId);
    console.log(`Buyer's updated token balance: ${updatedBuyerTokenHolding.amount}`);

    // get updated marketplace's token balance
    const updatedMarketplaceInfo = await algodClient.accountInformation(validatorAddress);
    const updatedMarketplaceTokenHolding = updatedMarketplaceInfo.assets.find(asset => asset.assetid === tokenId)
});


})().catch(e => {
    console.log(e);
    console.trace();
});
