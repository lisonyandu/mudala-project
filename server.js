const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");

require('dotenv').config({ path: "./.env.local" });
const algosdk = require('algosdk');
const algotxns = require("./algorand/index.js");


// const Web3 = require("web3");
const fs = require("fs");



var accounts;
// var assetID;
// const assetID = 212175420;

const initModels = require("./models/init-models");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("./utils/statuses");

// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT;
const HOST = "0.0.0.0";


const getAlgodClient = require("./clients/index.js");
// sandbox  local
const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient.getAlgodClient(network)


const regulator_address = process.env.NEXT_PUBLIC_REGULATOR_ADDR
const vendor_address = process.env.NEXT_PUBLIC_VENDOR_ADDR
const regulator = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC);
const regulator_2 = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC_2);
const assetID = parseInt(process.env.NEXT_PUBLIC_FT_ASSET_ID);

// Mudala Exchange (marketplace treasury) - mediates buy/sell trades
const exchange_address = process.env.NEXT_PUBLIC_EXCHANGE_ADDR;
const exchange = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_EXCHANGE_MNEMONIC);
const CCT_PRICE_ALGO = parseFloat(process.env.NEXT_PUBLIC_CCT_PRICE_ALGO || "0.1");
const BROKER_FEE_PCT = 0.01;



const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors());
app.get("/", (req, res) => {
    res.send("Welcome the API is running");
});

// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use("/member", memberRouter);
app.use("/validator", validatorRouter);


app.get("/api/validator", async (req, res) => {

  const balance = await algotxns.balanceOf(algodClient, regulator_address, assetID);
  console.log(balance);
  const total = await algotxns.totalSupply(algodClient, regulator_address, assetID);
  console.log(total);
  res.send({
    totalsupply: total.total_supply,
    balance: balance.balance,
    wallet: regulator_address,
  });
});

app.get("/api/totalsupply", async (req, res) => {
    try {
       
        const val = await algotxns.totalSupply(algodClient, regulator_address, assetID.assetID);
        res.send({balance: val});
    } catch (e) {
        console.log(e.message)
    }
});

app.get("/api/balance", async (req, res) => {
    try {
    
        console.log(member.walletaddress)
        const val = await algotxns.balanceOf(algodClient, member.walletaddress, assetID);
        console.log(val)

        res.send({balance: val});
    } catch (e) {
        console.log(e.message)
    }
});

app.post("/api/myaccount", async (req, res) => {
    try {
        const member = await models.RegisteredMembers.findOne({
            where: {walletaddress: req.body.walletaddress},
            
        });
    
            const val = await algotxns.balanceOf(algodClient, member.walletaddress, assetID);
        
        res.send({
            balance: val['balance'],
            membertype: member.membertype,
            projectid: member.projectid,
            taxid: member.taxid,
            walletaddress: member.walletaddress,
            memberid: member.pk
        });
    } catch (e) {
        res.status(400).send({error: e, message: "Unexpected error occurred 😤"});
    }
});
app.post("/api/transfer", async (req, res) => {
    try {

        // await algotxns.optInAsset('seller');
        const amount = parseInt(req.body.amount);

        const xtxn = await algotxns.getPaymentTxn(algodClient, regulator.addr, req.body.walletaddress,assetID,amount);
        // Must be signed by the account sending the asset  
        const rawSignedTxn = xtxn.signTxn(regulator.sk);
        console.log('Sending transaction to the network...sending 100 algos');
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
        // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);


        await models.CreditRequests.update(
            {
                status: statuses.APPROVED,
            },
            {
                where: {
                    memberid: req.body.memberid,
                    pk: req.body.code
                },
            }
        );

        res.status(200).json("done");
    } catch (e) {
        console.log(e)
        res.status(400).json({message: e});
    }
});

app.post("/api/mint", async (req, res) => {
    try {

        console.log("Lets Mint some more tokens")
        // Convert req.body.amount to BigInt
        const amount = parseInt(req.body.amount);
      
        const xtxn = await algotxns.getPaymentTxn(algodClient, regulator_2.addr, regulator_address,assetID, amount);
         // Must be signed by the account sending the asset  
        const rawSignedTxn = xtxn.signTxn(regulator_2.sk);
        console.log('Sending transaction to the network...sending 100 algos');
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
         // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);
         //Get the completed Transaction
        console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

        res.send({amount: amount
                // balance: bal
        });
    } catch (e) {
        console.log(e.message)
        res.status(400).json({message: " "})
    }
});
app.get("/api/config", (req, res) => {
    res.send({
        exchangeAddress: exchange_address,
        assetId: assetID,
        cctPriceAlgo: CCT_PRICE_ALGO,
    });
});

app.get("/api/market", async (req, res) => {
    try {
        const balance = await algotxns.balanceOf(algodClient, exchange_address, assetID);
        res.send({balance: balance.balance});
    } catch (e) {
        console.log(e.message);
        res.status(400).json({message: "error"});
    }
});

// Sell flow, mirrors /api/authenticate's build->sign->submit pattern:
// 1) prepare: backend builds the unsigned CCT->exchange transfer, seller signs it via Pera
// 2) submit: backend relays the signed transfer, confirms it, then pays the seller in ALGO (minus broker fee)
app.post("/api/market/sell/prepare", async (req, res) => {
    try {
        const {walletaddress, amount} = req.body;
        if (!algosdk.isValidAddress(walletaddress)) {
            return res.status(400).json({error: "Invalid Algorand address"});
        }
        const cctAmount = parseInt(amount);
        if (!(cctAmount > 0)) {
            return res.status(400).json({error: "Invalid amount"});
        }

        const xtxn = await algotxns.getPaymentTxn(algodClient, walletaddress, exchange_address, assetID, cctAmount);
        const encodedTxn = algosdk.encodeUnsignedTransaction(xtxn);
        res.status(200).json({txn: Buffer.from(encodedTxn).toString("base64")});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: e.message || "Unable to prepare sell transaction"});
    }
});

app.post("/api/market/sell/submit", async (req, res) => {
    try {
        const {walletaddress, amount, signedTxn} = req.body;
        const cctAmount = parseInt(amount);

        const rawSignedTxn = Buffer.from(signedTxn, "base64");
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
        await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);

        const payoutAlgo = cctAmount * CCT_PRICE_ALGO * (1 - BROKER_FEE_PCT);
        const payoutMicroAlgos = Math.round(payoutAlgo * 1e6);

        const suggestedParams = await algodClient.getTransactionParams().do();
        const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: exchange.addr,
            to: walletaddress,
            amount: payoutMicroAlgos,
            suggestedParams,
        });
        const rawSignedPayTxn = payTxn.signTxn(exchange.sk);
        const payoutTx = await algodClient.sendRawTransaction(rawSignedPayTxn).do();
        await algosdk.waitForConfirmation(algodClient, payoutTx.txId, 4);

        res.status(200).json({message: "sold", payoutAlgo, sellTxId: xtx.txId, payoutTxId: payoutTx.txId});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: e.message || "Unable to complete sale"});
    }
});

// Buy flow, same shape: prepare an ALGO->exchange payment for the buyer to sign,
// then relay + confirm it before transferring the corresponding CCT to the buyer.
app.post("/api/market/buy/prepare", async (req, res) => {
    try {
        const {walletaddress, amount} = req.body;
        if (!algosdk.isValidAddress(walletaddress)) {
            return res.status(400).json({error: "Invalid Algorand address"});
        }
        const algoAmount = parseFloat(amount);
        if (!(algoAmount > 0)) {
            return res.status(400).json({error: "Invalid amount"});
        }
        const microAlgos = Math.round(algoAmount * 1e6);

        const suggestedParams = await algodClient.getTransactionParams().do();
        const xtxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: walletaddress,
            to: exchange_address,
            amount: microAlgos,
            suggestedParams,
        });
        const encodedTxn = algosdk.encodeUnsignedTransaction(xtxn);
        res.status(200).json({txn: Buffer.from(encodedTxn).toString("base64")});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: e.message || "Unable to prepare buy transaction"});
    }
});

app.post("/api/market/buy/submit", async (req, res) => {
    try {
        const {walletaddress, amount, signedTxn} = req.body;
        const algoAmount = parseFloat(amount);

        const rawSignedTxn = Buffer.from(signedTxn, "base64");
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
        await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);

        const cctAmount = Math.floor(algoAmount / CCT_PRICE_ALGO);
        if (cctAmount <= 0) throw new Error("Amount too small to purchase any CCT");

        const suggestedParams = await algodClient.getTransactionParams().do();
        const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: exchange.addr,
            to: walletaddress,
            assetIndex: assetID,
            amount: cctAmount,
            suggestedParams,
        });
        const rawSignedAxfer = axferTxn.signTxn(exchange.sk);
        const payoutTx = await algodClient.sendRawTransaction(rawSignedAxfer).do();
        await algosdk.waitForConfirmation(algodClient, payoutTx.txId, 4);

        res.status(200).json({message: "bought", cctAmount, payTxId: xtx.txId, payoutTxId: payoutTx.txId});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: e.message || "Unable to complete purchase"});
    }
});

// Example backend route (express.js)

app.post('/api/authenticate', async (req, res) => {
    try {
      const { accountAddress } = req.body;

      if (!algosdk.isValidAddress(accountAddress)) {
        return res.status(400).json({ error: 'Invalid Algorand address' });
      }

      // 0-ALGO self-payment; only used to prove control of accountAddress via signature.
      const xtxn = await algotxns.getAuthTxn(algodClient, accountAddress);
      const encodedTxn = algosdk.encodeUnsignedTransaction(xtxn);

      res.status(200).json({ txn: Buffer.from(encodedTxn).toString('base64') });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



app.post('/api/submitTransaction', async (req, res) => {
    try {
      const { signedTxn } = req.body;

      const rawSignedTxn = Buffer.from(signedTxn, 'base64');
      const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);

      res.status(200).json({
        message: 'Transaction submitted successfully',
        txId: xtx.txId,
        confirmedRound: confirmedTxn['confirmed-round'],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

sequelise
    .authenticate()
    .then(async () => {
        console.log("Database connected...");
        const accounts = await algodClient.accounts;
        console.log(accounts);
        // networkId = await web3.eth.net.getId();
        // contractAddress = artifact.networks[networkId].address;
        // const regulator_address = process.env.ACCOUNT1_ADDRESS
        // const assetID = await carbonToken.createCarbonCreditToken(regulator_address);
        // CarbonCreditToken = new web3.eth.Contract(artifact.abi, contractAddress, {
        //     from: accounts[0],
        // });
    })
    .catch((err) => {
        console.log("Error connecting to database: " + err);
    });

sequelise
    .sync()
    .then(() => {
        app.listen(PORT, HOST);
        console.log(`App running on http://${HOST}:${PORT}`);
    })
    .catch((err) => console.log("Error synching models: " + err));

module.exports = app;
