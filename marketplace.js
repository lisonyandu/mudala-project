const algosdk = require('algosdk');
const readline = require('readline');
// Retrieve the token, server and port values for your installation in the 
// algod.net and algod.token files within the data directory

// sandbox
const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const server = "http://localhost";
const port = 4001;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
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

var account1_mnemonic = "mesh enemy swarm oyster same foil kangaroo across biology inflict remain electric angry destroy office solid parade labor place vital link coil flavor abstract convince";
var account2_mnemonic = "renew census border ethics fragile photo amused alone risk shop exercise aware slide chunk illness slide valid joy album culture evolve moral pretty about fantasy";
var account3_mnemonic = "busy zebra follow brand fire victory honey addict simple spot final garbage young critic monitor buffalo muffin sting hour ticket aunt elbow slow absorb pipe";
var account4_mnemonic = "proud decade wheat audit verify year inquiry nothing legal human galaxy turkey brown index leaf ride runway inch fresh fury order twist couple abandon shell";
// var regulator_pk = '47G77X4VEFQ3NSDS2LPBM236HGGEM3IL6T7TBWIMK4LVD4K7GPVLJ7B6CI'
// var seller_pk = 'VZN6ATQCJF3C37LM45DAVGRKS3R2VJ3K4AURNWB7U3IGAXXLGXTXNOYWXA'
// var buyer_pk = 'SUAMEZ3XNCLU2RJIWAV6PTXIPKLLSKHXFSZ3ZOHBMDIFL3EMDFV2BATA2Y'

var regulator_pk = algosdk.mnemonicToSecretKey(account1_mnemonic);
var seller_pk = algosdk.mnemonicToSecretKey(account2_mnemonic);
var buyer_pk = algosdk.mnemonicToSecretKey(account3_mnemonic);
var vendor_pk = algosdk.mnemonicToSecretKey(account4_mnemonic);

const regulator_address = regulator_pk.addr;
const seller_address = seller_pk.addr;
const buyer_address = buyer_pk.addr;
const vendor_address = vendor_pk.addr;

// console.log(regulator_address);
console.log(seller_address);
// console.log(buyer_address);
console.log(vendor_address);

// var regulator = `47G77X4VEFQ3NSDS2LPBM236HGGEM3IL6T7TBWIMK4LVD4K7GPVLJ7B6CI`
// var  assetID = null; // Replace with your asset ID
// Instantiate the algod wrapper

let algodclient = new algosdk.Algodv2(token, server, port);
// let params = algodclient.getTransactionParams().do();
let suggestedFeePerByte = 10;

// Debug Console should look similar to this

async function createCarbonCreditToken() {
   
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
        params);

    let rawSignedTxn = txn.signTxn(regulator.sk)
    let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

  
    // wait for transaction to be confirmed
    // const ptx = await algosdk.waitForConfirmation(algodclient, tx.txId, 100 );
    // Get the new asset's information from the creator account
    let ptx = await algodclient.pendingTransactionByAddress(regulator_pk.addr).do();
    assetID = ptx["asset-index"];
    //Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + ptx["confirmed-round"]);
   console.log(assetID)
    return{assetID};
}
// createCarbonCreditToken()

// const {assetID} = createCarbonCreditToken()
assetID = 166644084;   //166644084

let txId;

async function requestTokens() {
  try {
    // ask user if they want to request tokens
    rl.question('Do you want to request additional tokens from the regulator? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        // get transaction parameters
        console.log('Getting transaction parameters...');
        let params;
        try {
          params = await algodclient.getTransactionParams().do();
        } catch (error) {
          console.error('Error getting transaction parameters:', error);
          return;
        }

        const sender = seller_pk.addr;
        const recipient = regulator_pk.addr;
        const revocationTarget = undefined;
        const closeRemainderTo = undefined;
        //Amount of the asset to transfer
        const amount = 0;
        // create note with token request message
        let note;
        try {
          note = algosdk.encodeObj({ message: "Token request from seller" });
        } catch (error) {
          console.error('Error encoding note:', error);
          return;
        }
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
        let xtx;
        try {
          xtx = await algodclient.sendRawTransaction(rawSignedTxn).do();
        } catch (error) {
          console.error('Error sending transaction to the network:', error);
          return;
        }
        const txId = xtx.txId;
        console.log(`Token request transaction ID: ${txId}`);
        // wait for regulator to approve or decline request
        console.log('Waiting for regulator to approve or decline request...');
        try {
          await waitForApproval(txId, params, suggestedFeePerByte, note);
        } catch (error) {
          console.error('Error getting regulator approval:', error);
          return;
        }
        // ask for next action
        askForAction();
      } else {
        // close readline interface
        rl.close();
      }
    });
  } catch (error) {
    console.error('Error in requestTokens:', error);
    return;
  }
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
      const status = await algodclient.status().do();
      const currentRound = status["last-round"] + 1;
      console.log(`Waiting for block ${currentRound} to be confirmed...`);
  
      await waitForRound(currentRound);
    //   askForAction();
      // get the transaction information
      const txInfo = await algodclient.pendingTransactionInformation(txId).do();
      if (txInfo["confirmed-round"]) {
        console.log(`Transaction confirmed in round ${txInfo["confirmed-round"]}.`);
        break;
      }
  
      // ask the regulator to approve or decline the request
      const answer = await new Promise(resolve => {
        rl.question(`Regulator, do you want to approve the request from ${seller_pk.addr}? (y/n): `, (answer) => {
          resolve(answer.toLowerCase());
        });
      });
      console.log('Regulator answer:', answer);
      
      if (answer === 'y') {

        const vendorBalance_b4 = await getTokenBalance(algodclient, vendor_address, assetID);
        console.log(`Regulator's current token balance: ${vendorBalance_b4}`);

        // opt-in to asset
        await optInAsset('seller');

        // get transaction parameters
        const params = await algodclient.getTransactionParams().do();
        const sender = regulator_address;
        const recipient = seller_address;
        const revocationTarget = undefined;
        const closeRemainderTo = undefined;
        const fee = 10;
        const amount = await new Promise(resolve => {
          rl.question(`Regulator, how many tokens do you want to transfer to ${seller_pk.addr}? `, (amount) => {
            resolve(parseInt(amount));
          });
        });
  
        console.log(`Regulator specified transfer amount: ${amount}`);
  
        // create asset transfer transaction with specified amount
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
        console.log('Signing transaction with regulator private key...');
        const rawSignedTxn = xtxn.signTxn(regulator_pk.sk);
        console.log('Sending transaction to the network...');
        const xtx = await algodclient.sendRawTransaction(rawSignedTxn).do();
        console.log(`Token transfer transaction ID: ${xtx.txId}`);
        // Wait for confirmation
        confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"])
        console.log(`Regulator has successfully transferred ${amount} CCT to the seller`);

        const vendorBalance = await getTokenBalance(algodclient, vendor_address, assetID);
        console.log(`Regulator's latest token balance: ${vendorBalance}`);
        // console.log(`Waiting for block ${xtx['confirmed-round']} to be confirmed...`);
        // await waitForRound(xtx['confirmed-round']);
      } else {
        console.log('Regulator declined the request.');
        break;
      }
    }
  }
// requestTokens();

// waitForApproval()
  
// requestTokens()

// set up marketplace balance
let marketBalance = 0;
const tokensPerAlgo = 100;


// sell carbon credits to the market
async function sellCredits() {
  await optInAsset('vendor');
  const sellerBalance = await getTokenBalance(algodclient, seller_address, assetID);
  console.log(`Seller's current token balance: ${sellerBalance}`);
  // get transaction parameters
  params = await algodclient.getTransactionParams().do();
  sender = seller_pk.addr;
  recipient = vendor_pk.addr;
  revocationTarget = undefined;
  closeRemainderTo = undefined;
  //Amount of the asset to transfer
  amount = 0;
  // ask user for number of credits to sell
  rl.question('How many carbon credits do you want to sell?: ', async (answer) => {
    const numCredits = parseInt(answer);
    // get transaction parameters
    amount = numCredits;
    // create note with sell message
    const note = algosdk.encodeObj({ message: `Carbon credits sold to market by ${seller_pk.addr}` });
    // create asset transfer transaction with suggested params and no amount
    let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount,  
        note, 
        assetID, 
        params);
    // sign transaction with seller private key
    rawSignedTxn = xtxn.signTxn(seller_pk.sk)
    // send transaction and log transaction ID
    let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
    // console.log(`Transaction ID: ${txId}`);
    // Wait for confirmation
    confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"])
    // update marketplace balance
    marketBalance += numCredits;
    const sellerBalance = await getTokenBalance(algodclient, seller_address, assetID);
    // update seller's Algo balance
    const algoAmount = amount / tokensPerAlgo;
    const sellerAlgoBalance = await algodclient.accountInformation(sender).do();
    const sellerNewAlgoBalance = sellerAlgoBalance.amount + algoAmount;
    console.log(`Seller's latest Algo balance: ${sellerNewAlgoBalance}`);
    console.log(`Seller's latest token balance: ${sellerBalance}`);
    // ask user for next action
    askForAction();
  });
}



  
// sellCredits()
// view marketplace balance
function viewMarketBalance() {
  console.log(`Marketplace balance: ${marketBalance}`);
  // ask user for next action
  askForAction();
}
// viewMarketBalance()

// buy carbon credits from the market
async function buyCredits() {

const buyerBalance = await getTokenBalance(algodclient, buyer_address, assetID);
console.log(`Buyer's current token balance: ${buyerBalance}`);
// opt-in to asset
await optInAsset('buyer');
  // get transaction parameters
  params = await algodclient.getTransactionParams().do();
  sender = vendor_pk.addr;
  recipient = buyer_pk.addr;
  revocationTarget = undefined;
  closeRemainderTo = undefined;
  //Amount of the asset to transfer
  amount = 0;
    // ask user for number of credits to buy
    rl.question('How many carbon credits do you want to buy?: ', async (answer) => {
      const numCredits = parseInt(answer);
      // check if there are enough credits in the market
      if (numCredits > marketBalance) {
        console.log('There are not enough carbon credits in the market.');
        askForAction();
        return;
      }
      amount = numCredits;
      // create note with buy message
      const note = algosdk.encodeObj({ message: `Carbon credits bought from market by ${buyer_pk.addr}` });
      // create asset transfer transaction with suggested params and no amount
      // create asset transfer transaction with suggested params and no amount
    let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount,  
        note, 
        assetID, 
        params);
 //  sign transaction with vendor private key
    rawSignedTxn = xtxn.signTxn(vendor_pk.sk)
    // send transaction and log transaction ID
    let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
    // console.log(`Transaction ID: ${txId}`);
    // Wait for confirmation
    confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"])

    // update marketplace balance
    marketBalance -= numCredits;
   
    const buyerBalance = await getTokenBalance(algodclient, buyer_address, assetID);
    console.log(`Buyer's latest token balance: ${buyerBalance}`);

    // ask user for next action
    askForAction();
  });
}

// buyCredits()


// ask user for action to take
// ask user for action to take
function askForAction() {
    rl.question('What would you like to do? (1. Sell credits, 2. View market balance, 3. Buy credits, 4. Request tokens, 5.Approve or decline token requests, 6. Exit): ', (answer) => {
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
        requestTokens();
        break;
      case 5:
        waitForApproval();
        break;
      case 6:
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
console.log('Welcome to Mudala platform!')
askForAction()

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

  
  
// Get Balance of specific user. 
async function getTokenBalance(algodclient, address, assetID) {
    try {
      const isValid = algosdk.isValidAddress(address);
      if (!isValid) {
        console.log('Invalid address');
        return null;
      }
    //   console.log(`Getting token balance for address: ${address}`);
      const accountInfo = await algodclient.accountInformation(address).do();
      const assets = accountInfo.assets;
      const tokenBalance = assets.find((asset) => asset['asset-id'] === assetID);
      if (tokenBalance !== undefined) {
        // console.log(`Token balance for asset with ID ${assetID}: ${tokenBalance.amount} CCT`);
        balance = tokenBalance.amount;
        return tokenBalance.amount;
      } else {
        console.log(`Token balance for asset with ID ${assetID}: 0 CCT`);
        console.log(`Account does not hold asset with ID ${assetID}`);
        return 0; // set token balance to 0 if user does not hold the asset
      }
    } catch (error) {
      console.log(`Error getting token balance: ${error}`);
      return null;
    }
}
 


