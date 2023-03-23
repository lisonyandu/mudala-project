const readline = require('readline');
const algosdk = require('algosdk');

const assetID = 12345; // Replace with your asset ID
const algodClientURL = 'https://api.algoexplorer.io';
const algodClient = new algosdk.Algodv2('', algodClientURL, '');
const vendorAddress = 'YOUR_VENDOR_ADDRESS';
const sellerAddress = 'YOUR_SELLER_ADDRESS';
const buyerAddress = 'YOUR_BUYER_ADDRESS';

async function getTokenBalance(algodclient, address) {
  const accountInfo = await algodclient.accountInformation(address).do();
  const assets = accountInfo.assets;
  const tokenBalance = assets.find((asset) => asset['asset-id'] === assetID).amount;
  return tokenBalance;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your address: ', async function (address) {
  let balanceMsg;
  if (address === vendorAddress) {
    const tokenBalance = await getTokenBalance(algodClient, vendorAddress);
    balanceMsg = `Vendor Token balance: ${tokenBalance}`;
  } else if (address === sellerAddress) {
    const tokenBalance = await getTokenBalance(algodClient, sellerAddress);
    balanceMsg = `Seller Token balance: ${tokenBalance}`;
  } else if (address === buyerAddress) {
    const tokenBalance = await getTokenBalance(algodClient, buyerAddress);
    balanceMsg = `Buyer Token balance: ${tokenBalance}`;
  } else {
    balanceMsg = 'Unknown address';
  }

  console.log(balanceMsg);
  rl.close();
});
