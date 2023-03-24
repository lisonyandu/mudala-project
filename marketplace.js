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
// var vendor_pk = '47G77X4VEFQ3NSDS2LPBM236HGGEM3IL6T7TBWIMK4LVD4K7GPVLJ7B6CI'
// var seller_pk = 'VZN6ATQCJF3C37LM45DAVGRKS3R2VJ3K4AURNWB7U3IGAXXLGXTXNOYWXA'
// var buyer_pk = 'SUAMEZ3XNCLU2RJIWAV6PTXIPKLLSKHXFSZ3ZOHBMDIFL3EMDFV2BATA2Y'

var vendor_pk = algosdk.mnemonicToSecretKey(account1_mnemonic);
var seller_pk = algosdk.mnemonicToSecretKey(account2_mnemonic);
var buyer_pk = algosdk.mnemonicToSecretKey(account3_mnemonic);

const vendor_address = vendor_pk.addr;
const seller_address = seller_pk.addr;
const buyer_address = buyer_pk.addr;

console.log(vendor_address);
console.log(seller_address);
console.log(buyer_address);

// var vendor_pk = `47G77X4VEFQ3NSDS2LPBM236HGGEM3IL6T7TBWIMK4LVD4K7GPVLJ7B6CI`
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
    let addr = vendor_pk.addr;
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
    let manager = vendor_pk.addr;
    // Specified address is considered the asset reserve
    // (it has no special privileges, this is only informational)
    let reserve = vendor_pk.addr;
    // Specified address can freeze or unfreeze user asset holdings 
    let freeze = vendor_pk.addr;
    // Specified address can revoke user asset holdings and send 
    // them to other addresses    
    let clawback = vendor_pk.addr;

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

    let rawSignedTxn = txn.signTxn(vendor_pk.sk)
    let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

  
    // wait for transaction to be confirmed
    // const ptx = await algosdk.waitForConfirmation(algodclient, tx.txId, 100 );
    // Get the new asset's information from the creator account
    let ptx = await algodclient.pendingTransactionByAddress(vendor_pk.addr).do();
    assetID = ptx["asset-index"];
    //Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + ptx["confirmed-round"]);
   console.log(assetID)
    return{assetID};
}
// createCarbonCreditToken()

// const {assetID} = createCarbonCreditToken()
assetID = 166643930;   //166644084
// / request tokens from vendor
async function requestTokens() {

  // ask user if they want to request tokens
  rl.question('Do you want to request additional tokens from the vendor? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
         
        // get transaction parameters
        params = await algodclient.getTransactionParams().do();
        sender = seller_pk.addr;
        recipient = vendor_pk.addr;
        revocationTarget = undefined;
        closeRemainderTo = undefined;
        //Amount of the asset to transfer
        amount = 0;
      // create note with token request message
        const note = algosdk.encodeObj({ message: "Token request from seller" });
      // create asset transfer transaction with suggested params and no amount

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
      rawSignedTxn = xtxn.signTxn(seller_pk.sk)
      let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
      txId = xtx.txId
      console.log(`Token request transaction ID: ${txId}`);
  
      // wait for vendor to approve or decline request
      waitForApproval(params, suggestedFeePerByte, note);
    } else {
      // close readline interface
      rl.close();
    }

    // return{txId}
  });
}

// wait for vendor to approve or decline request
async function waitForApproval(params, suggestedFeePerByte, note) {
    console.log('Waiting for vendor to approve or decline request...');
    let confirmedTxn = null;
    while (confirmedTxn === null) {
      // get latest transactions for vendor account
      const txns = await algodclient.pendingTransactionByAddress(vendor_pk.addr).do();
      if (txns && txns['top-transactions'] && txns['top-transactions'].length > 0) {
        const lastTxn = txns['top-transactions'];
        const latestTxn = lastTxn[0];
        if (latestTxn && latestTxn['txn'] && latestTxn['txn'].note) {
          const lnote = latestTxn['txn'].note;
          console.log(lnote);
          if (lnote === note) {
            // ask vendor to approve or decline request
            const answer = await new Promise(resolve => {
              rl.question(`Vendor, do you want to approve the request from ${seller_pk.addr}? (y/n): `, (answer) => {
                resolve(answer.toLowerCase());
              });
            });
            if (answer === 'y') {
              // get transaction parameters
              sender = vendor_address;
              recipient = seller_address;
              amount = 10;
              // create asset transfer transaction with 10 CCT
              const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParams({
                sender ,
                recipient ,
                amount, // transfer 10 CCT
                assetID,
                suggestedFeePerByte,
              }, params);
              // sign transaction with vendor private key
              const signedTxn = assetTransferTxn.signTxn(vendor_address.sk);
              // send transaction and log transaction ID
              const txId = await algodclient.sendRawTransaction(signedTxn).do();
              console.log(`Token transfer transaction ID: ${txId}`);
              // set confirmed transaction
              confirmedTxn = signedTxn;
            } else {
              // close readline interface
              rl.close();
            }
          }
        } else {
          console.log('Error: latest transaction object or note property is undefined');
        }
      } else {
        console.log('No pending transactions found for address:', vendor_pk.addr);
      }
      // wait for 60 seconds before checking for new transactions
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
// requestTokens()

// set up marketplace balance
let marketBalance = 0;

// sell carbon credits to the market
async function sellCredits() {
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
        // askForAction();
        return;
      }
      amount = numCredits;
      // create note with buy message
      const note = algosdk.encodeObj({ message: `Carbon credits bought from market by ${buyer.addr}` });
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
 //  sign transaction with buyer private key
    rawSignedTxn = xtxn.signTxn(buyer_pk.sk)
    // send transaction and log transaction ID
    let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());
    // console.log(`Transaction ID: ${txId}`);
    // Wait for confirmation
    confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"])

    // update marketplace balance
    marketBalance -= numCredits;
    // ask user for next action
    // askForAction();
  });
}

buyCredits()
// OPT IN RECEIVE ASSET BY USER TYPE
// Define a function to handle user input
// async function optInByUser(userType) {
//   let sender;
//   let recipient;
//   let note;
//   if (userType === 'buyer') {
//     sender = buyer_address;
//     recipient = sender;
//   } else if (userType === 'seller') {
//     // Define seller account
//     // const seller_pk = algosdk.mnemonicToSecretKey("seller mnemonic"); // replace with your seller account's mnemonic
//     sender = seller_address;
//     recipient = sender;
//   } else {
//     console.log('Invalid user type. Please enter "buyer" or "seller".');
//     return;
//   }

//   // We set revocationTarget to undefined as 
//   // This is not a clawback operation
//   const revocationTarget = undefined;
//   // CloseReaminerTo is set to undefined as
//   // we are not closing out an asset
//   const closeRemainderTo = undefined;
//   // We are sending 0 assets
//   const amount = 0;
//   // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
//   const params = await algodclient.getTransactionParams().do();
//   const opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
//     sender, 
//     recipient, 
//     closeRemainderTo, 
//     revocationTarget,
//     amount, 
//     note, 
//     assetID, 
//     params
//   );

//   // Must be signed by the account wishing to opt in to the asset    
//   const privateKey = userType === 'seller' ? seller_pk.sk : buyer_pk.sk;
//   const rawSignedTxn = opttxn.signTxn(privateKey);
//   const opttx = await algodclient.sendRawTransaction(rawSignedTxn).do();
//   // Wait for confirmation
//   const confirmedTxn = await algosdk.waitForConfirmation(algodclient, opttx.txId, 4);
//   //Get the completed Transaction
//   //Get the completed Transaction
//   console.log("Transaction " + opttx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

//   //You should now see the new asset listed in the account information
//   console.log(`${userType}_pk = ${sender}`);
//   await printAssetHolding(algodclient, sender, assetID);
// }

// // Prompt the user to enter the user type and opt-in
// rl.question('If you want to opt in to receive asset, specify your user type (buyer or seller) and then opt in: ', async (userType) => {
//   await optInByUser(userType.trim().toLowerCase());
//   rl.close();
// });
// optInByUser()

// Get Balance by specifying a user. 

//    async function getTokenBalance(algodclient, address) {
//     try {
//       const isValid = algosdk.isValidAddress(address);
//       if (!isValid) {
//         console.log('Invalid address');
//         return null;
//       }
//       const accountInfo = await algodclient.accountInformation(address).do();
//       const assets = accountInfo.assets;
//       const tokenBalance = assets.find((asset) => asset['asset-id'] === assetID).amount;
//       return tokenBalance;
//     } catch (error) {
//       console.log(`Error getting token balance: ${error}`);
//       return null;
//     }
//   }
  
  
//   rl.question('Enter your user type (vendor, seller, or buyer): ', async function (userType) {
//     let address;
//     switch (userType) {
//       case 'vendor':
//         address = vendor_address;
//         break;
//       case 'seller':
//         address = seller_address;
//         break;
//       case 'buyer':
//         address = buyer_address;
//         break;
//       default:
//         console.log('Unknown user type');
//         rl.close();
//         return;
//     }
    
//     const tokenBalance = await getTokenBalance(algodclient, address);
//     if (tokenBalance !== null) {
//       console.log(`${userType} Token balance: ${tokenBalance}`);
//     }
//     rl.close();
//   });
 

