const algosdk = require('algosdk');
// configure Algorand client
const algodToken = 'algod-token';
const algodServer = 'algod-address';
const algodPort = 'algod-port';
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);



// configure readline interface
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// set up accounts
const seller = {
  addr: 'seller-address',
  sk: new Uint8Array([/* seller secret key */]),
};
const vendor = {
  addr: 'vendor-address',
  sk: new Uint8Array([/* vendor secret key */]),
};
const buyer = {
  addr: 'buyer-address',
  sk: new Uint8Array([/* buyer secret key */]),
};
// set up asset
const assetID = 123456; // pre-defined asset ID
// set up marketplace balance
let marketBalance = 0;

// sell carbon credits to the market
async function sellCredits() {
  // get transaction parameters
  const txnParams = await algodClient.getTransactionParams().do();
  const suggestedFeePerByte = 10;
  // ask user for number of credits to sell
  rl.question('How many carbon credits do you want to sell?: ', async (answer) => {
    const numCredits = parseInt(answer);
    // create note with sell message
    const note = algosdk.encodeObj({ message: `Carbon credits sold to market by ${seller.addr}` });
    // create asset transfer transaction with suggested params and no amount
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: seller.addr,
      to: vendor.addr,
      amount: 0, // set amount to 0
      assetIndex: assetID,
      suggestedFeePerByte,
      note,
    }, txnParams);
    // sign transaction with seller private key
    const signedTxn = assetTransferTxn.signTxn(seller.sk);
    // send transaction and log transaction ID
    const txId = await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`Transaction ID: ${txId}`);
    // update marketplace balance
    marketBalance += numCredits;
    // ask user for next action
    askForAction();
  });
}
// view marketplace balance
function viewMarketBalance() {
  console.log(`Marketplace balance: ${marketBalance}`);
  // ask user for next action
  askForAction();
}

// buy carbon credits from the market
async function buyCredits() {
  // get transaction parameters
  const txnParams = await algodClient.getTransactionParams().do();
  const suggestedFeePerByte = 10;
  // ask user for number of credits to buy
  rl.question('How many carbon credits do you want to buy?: ', async (answer) => {
    const numCredits = parseInt(answer);
    // check if there are enough credits in the market
    if (numCredits > marketBalance) {
      console.log('There are not enough carbon credits in the market.');
      askForAction();
      return;
    }
    // create note with buy message
    const note = algosdk.encodeObj({ message: `Carbon credits bought from market by ${buyer.addr}` });
    // create asset transfer transaction with suggested params and no amount
    const assetTransferTxn = algosdk.makeAssetTransferTx

nWithSuggestedParamsFromObject({
from: vendor.addr,
to: buyer.addr,
amount: 0, // set amount to 0
assetIndex: assetID,
suggestedFeePerByte,
note,
}, txnParams);

//  sign transaction with buyer private key
const signedTxn = assetTransferTxn.signTxn(buyer.sk);
// send transaction and log transaction ID
const txId = await algodClient.sendRawTransaction(signedTxn).do();
console.log(`Transaction ID: ${txId}`);
// update marketplace balance
marketBalance -= numCredits;
// ask user for next action
askForAction();

});
}
// ask user for action to take
function askForAction() {
rl.question('What would you like to do? (1. Sell credits, 2. View market balance, 3. Buy credits, 4. Exit): ', (answer) => {
const action = parseInt(answer);
switch (action) {
  case 1:
    sellCredits();
    break;
  case 2:
    viewMarketBalance();
    break;
  case 3:
    buyCredits();
    break;
  case 4:
    rl.close();
    break;
  default:
    console.log('Invalid action.');
    askForAction();
    break;
}
});
}
// start program


let txId;

async function requestTokens() {
  // ask user if they want to request tokens
  rl.question('Do you want to request additional tokens from the vendor? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      // get transaction parameters
      console.log('Getting transaction parameters...');
      const params = await algodclient.getTransactionParams().do();
      const sender = seller_pk.addr;
      const recipient = vendor_pk.addr;
      const revocationTarget = undefined;
      const closeRemainderTo = undefined;
      //Amount of the asset to transfer
      const amount = 0;
      // create note with token request message
      const note = algosdk.encodeObj({ message: "Token request from seller" });
      // console.log('Note:', note);
      // create asset transfer transaction with suggested params and no amount
      console.log('Creating asset transfer transaction...');
      const xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount,  
        note, 
        assetID, 
        params
      );
      // Must be signed by the account sending the asset  
      console.log('Signing transaction with seller private key...');
      const rawSignedTxn = xtxn.signTxn(seller_pk.sk);
      console.log('Sending transaction to the network...');
      const xtx = await algodclient.sendRawTransaction(rawSignedTxn).do();
      txId = xtx.txId;
      console.log(`Token request transaction ID: ${txId}`);
      // wait for vendor to approve or decline request
      console.log('Waiting for vendor to approve or decline request...');
      await waitForApproval(txId, params, suggestedFeePerByte, note);
    } else {
      // close readline interface
      rl.close();
    }
  });
}
async function waitForRound(round) {
    while (true) {
      let status = (await algodclient.status().do());
      if (status["last-round"] >= round) {
        return status;
      }
      await new Promise(resolve => setTimeout(resolve, suggestedFeePerByte));
    }
  }
  
async function waitForApproval(txId, params, fee, note) {
  while (true) {
    // wait for the next block
    const status = (await algodclient.status().do());
    const currentRound = status["last-round"] + 1;
    console.log(`Waiting for block ${currentRound} to be confirmed...`);

    await waitForRound(currentRound);

    // get the transaction information
    const txInfo = await algodclient.pendingTransactionInformation(txId).do();
    if (txInfo["confirmed-round"]) {
      console.log(`Transaction confirmed in round ${txInfo["confirmed-round"]}.`);
      break;
    }
  }
}

requestTokens();
  