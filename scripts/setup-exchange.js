// One-off setup: opt the Mudala Exchange account into the CCT asset (required
// before it can hold/receive tokens) and seed it with CCT from the regulator
// so /api/market/buy has something to sell. Run once per environment/network.
//
// Usage: node scripts/setup-exchange.js [seedAmount]

require("dotenv").config({path: "./.env.local"});
const algosdk = require("algosdk");
const getAlgodClient = require("../clients/index.js");
const algotxns = require("../algorand/index.js");

(async () => {
    const network = process.env.NEXT_PUBLIC_NETWORK || "TestNet";
    const algodClient = getAlgodClient.getAlgodClient(network);
    const assetID = parseInt(process.env.NEXT_PUBLIC_FT_ASSET_ID);

    const regulator = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC);
    const exchange = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_EXCHANGE_MNEMONIC);

    const info = await algodClient.accountInformation(exchange.addr).do();
    console.log(`Exchange account: ${exchange.addr}`);
    console.log(`Exchange ALGO balance: ${info.amount / 1e6} ALGO`);
    if (info.amount < 1e6) {
        console.warn("Warning: exchange account has less than 1 ALGO. Fund it via the TestNet dispenser: https://bank.testnet.algorand.network/");
    }

    const alreadyOptedIn = info.assets.some((a) => a["asset-id"] === assetID);

    if (!alreadyOptedIn) {
        const optInTxn = await algotxns.getAssetOptInTxn(algodClient, exchange.addr, assetID);
        const signed = optInTxn.signTxn(exchange.sk);
        const {txId} = await algodClient.sendRawTransaction(signed).do();
        await algosdk.waitForConfirmation(algodClient, txId, 4);
        console.log(`Opted exchange account into asset ${assetID} (txn ${txId})`);
    } else {
        console.log(`Exchange account is already opted into asset ${assetID}`);
    }

    const seedAmount = parseInt(process.argv[2] || "100");
    const seedTxn = await algotxns.getPaymentTxn(algodClient, regulator.addr, exchange.addr, assetID, seedAmount);
    const signedSeed = seedTxn.signTxn(regulator.sk);
    const {txId: seedTxId} = await algodClient.sendRawTransaction(signedSeed).do();
    await algosdk.waitForConfirmation(algodClient, seedTxId, 4);
    console.log(`Seeded exchange with ${seedAmount} CCT (txn ${seedTxId})`);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
