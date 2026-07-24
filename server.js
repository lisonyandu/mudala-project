require('dotenv').config({ path: "./.env.local" });

const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");
const algosdk = require('algosdk');
const algotxns = require("./algorand/index.js");
const {signSessionToken, requireWallet, requireRegulator} = require("./middleware/auth.js");


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

// The CCT asset was created with 2 decimals; every endpoint here works in
// "human" CCT units (e.g. 6.40) and converts to/from base units only at the
// point of building an on-chain transaction, so the app's numbers always
// match what Pera Wallet's own UI shows for the same balance.
const CCT_DECIMALS = 2;
const CCT_UNITS = 10 ** CCT_DECIMALS;
const toBaseUnits = (human) => Math.round(parseFloat(human) * CCT_UNITS);
const toHuman = (base) => base / CCT_UNITS;

// Mudala Retirement (permanent sink) - clawed-back credits land here and stay
const retirement_address = process.env.NEXT_PUBLIC_RETIREMENT_ADDR;

// Translate algod's raw rejection text into something a user can act on,
// instead of surfacing "TransactionPool.Remember: transaction XYZ: ..." as-is.
function friendlyChainError(e) {
    const raw = (e && (e.message || e.toString())) || "";
    if (/underflow|overspend/i.test(raw)) {
        return "Insufficient balance for this amount.";
    }
    if (/asset holding.*not.*found|has not opted in/i.test(raw)) {
        return "That wallet hasn't opted into the CCT asset yet.";
    }
    return null;
}



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


app.get("/api/validator", requireWallet, requireRegulator, async (req, res) => {

  const balance = await algotxns.balanceOf(algodClient, regulator_address, assetID);
  const total = await algotxns.totalSupply(algodClient, regulator_address, assetID);
  res.send({
    totalsupply: toHuman(total.total_supply),
    balance: toHuman(balance.balance),
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

app.post("/api/myaccount", requireWallet, async (req, res) => {
    try {
        const member = await models.RegisteredMembers.findOne({
            where: {walletaddress: req.walletAddress},

        });
    
            const val = await algotxns.balanceOf(algodClient, member.walletaddress, assetID);
        
        res.send({
            balance: toHuman(val['balance'] || 0),
            membertype: member.membertype,
            companyname: member.companyname,
            projectid: member.projectid,
            taxid: member.taxid,
            walletaddress: member.walletaddress,
            memberid: member.pk
        });
    } catch (e) {
        res.status(400).send({error: e, message: "Unexpected error occurred 😤"});
    }
});
app.post("/api/transfer", requireWallet, requireRegulator, async (req, res) => {
    try {

        // await algotxns.optInAsset('seller');
        const amount = toBaseUnits(req.body.amount);

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

app.post("/api/mint", requireWallet, requireRegulator, async (req, res) => {
    try {

        console.log("Lets Mint some more tokens")
        const humanAmount = parseFloat(req.body.amount);
        const amount = toBaseUnits(humanAmount);

        const xtxn = await algotxns.getPaymentTxn(algodClient, regulator_2.addr, regulator_address,assetID, amount);
         // Must be signed by the account sending the asset
        const rawSignedTxn = xtxn.signTxn(regulator_2.sk);
        console.log('Sending transaction to the network...sending 100 algos');
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
         // Wait for confirmation
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);
         //Get the completed Transaction
        console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

        res.send({amount: humanAmount});
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
        cctDecimals: CCT_DECIMALS,
        regulatorOperatorAddress: process.env.NEXT_PUBLIC_REGULATOR_OPERATOR_ADDR,
    });
});

app.get("/api/market", async (req, res) => {
    try {
        const balance = await algotxns.balanceOf(algodClient, exchange_address, assetID);
        res.send({balance: toHuman(balance.balance || 0)});
    } catch (e) {
        console.log(e.message);
        res.status(400).json({message: "error"});
    }
});

// Sell flow, mirrors /api/authenticate's build->sign->submit pattern:
// 1) prepare: backend builds the unsigned CCT->exchange transfer, seller signs it via Pera
// 2) submit: backend relays the signed transfer, confirms it, then pays the seller in ALGO (minus broker fee)
app.post("/api/market/sell/prepare", requireWallet, async (req, res) => {
    try {
        const {amount} = req.body;
        const walletaddress = req.walletAddress;
        const cctAmount = parseFloat(amount);
        if (!(cctAmount > 0)) {
            return res.status(400).json({error: "Invalid amount"});
        }

        const xtxn = await algotxns.getPaymentTxn(algodClient, walletaddress, exchange_address, assetID, toBaseUnits(cctAmount));
        const encodedTxn = algosdk.encodeUnsignedTransaction(xtxn);
        res.status(200).json({txn: Buffer.from(encodedTxn).toString("base64")});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: friendlyChainError(e) || e.message || "Unable to prepare sell transaction"});
    }
});

app.post("/api/market/sell/submit", requireWallet, async (req, res) => {
    try {
        const {amount, signedTxn} = req.body;
        const walletaddress = req.walletAddress;
        const cctAmount = parseFloat(amount);

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
        res.status(400).json({message: friendlyChainError(e) || e.message || "Unable to complete sale"});
    }
});

// Buy flow, same shape: prepare an ALGO->exchange payment for the buyer to sign,
// then relay + confirm it before transferring the corresponding CCT to the buyer.
app.post("/api/market/buy/prepare", requireWallet, async (req, res) => {
    try {
        const {amount} = req.body;
        const walletaddress = req.walletAddress;
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
        res.status(400).json({message: friendlyChainError(e) || e.message || "Unable to prepare buy transaction"});
    }
});

app.post("/api/market/buy/submit", requireWallet, async (req, res) => {
    try {
        const {amount, signedTxn} = req.body;
        const walletaddress = req.walletAddress;
        const algoAmount = parseFloat(amount);

        const rawSignedTxn = Buffer.from(signedTxn, "base64");
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
        await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);

        // Round to the asset's own precision so the base-unit conversion below is exact
        const cctAmount = Math.floor((algoAmount / CCT_PRICE_ALGO) * CCT_UNITS) / CCT_UNITS;
        if (cctAmount <= 0) throw new Error("Amount too small to purchase any CCT");

        const suggestedParams = await algodClient.getTransactionParams().do();
        const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: exchange.addr,
            to: walletaddress,
            assetIndex: assetID,
            amount: toBaseUnits(cctAmount),
            suggestedParams,
        });
        const rawSignedAxfer = axferTxn.signTxn(exchange.sk);
        const payoutTx = await algodClient.sendRawTransaction(rawSignedAxfer).do();
        await algosdk.waitForConfirmation(algodClient, payoutTx.txId, 4);

        res.status(200).json({message: "bought", cctAmount, payTxId: xtx.txId, payoutTxId: payoutTx.txId});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: friendlyChainError(e) || e.message || "Unable to complete purchase"});
    }
});

// Permanently retire CCT: clawed back from the holder's wallet into the
// retirement sink account by the asset's clawback authority (regulator_2),
// so no signature is required from the holder - same trust model as
// mint/transfer. The chain (retirement account balance) is the source of
// truth for total retired; RetirementRecords is just the audit trail tying
// it back to a member.
app.post("/api/retire", requireWallet, async (req, res) => {
    try {
        const {amount} = req.body;
        const walletaddress = req.walletAddress;
        const cctAmount = parseFloat(amount);
        if (!(cctAmount > 0)) {
            return res.status(400).json({message: "Invalid amount"});
        }

        const member = await models.RegisteredMembers.findOne({where: {walletaddress}});
        if (!member) {
            return res.status(400).json({message: "Member not found"});
        }

        const suggestedParams = await algodClient.getTransactionParams().do();
        const clawbackTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: regulator_2.addr,
            to: retirement_address,
            assetIndex: assetID,
            amount: toBaseUnits(cctAmount),
            assetSender: walletaddress,
            suggestedParams,
        });
        const rawSignedTxn = clawbackTxn.signTxn(regulator_2.sk);
        const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
        await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);

        const n = new Date();
        await models.RetirementRecords.create({
            memberid: member.pk,
            amount: cctAmount,
            date: `${n.getDate()}/${n.getMonth() + 1}/${n.getFullYear()}`,
            txid: xtx.txId,
        });

        res.status(200).json({message: "retired", amount: cctAmount, txId: xtx.txId});
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: friendlyChainError(e) || e.message || "Unable to retire credits"});
    }
});

app.post("/api/myretirements", requireWallet, async (req, res) => {
    try {
        const member = await models.RegisteredMembers.findOne({where: {walletaddress: req.walletAddress}});
        if (!member) {
            return res.status(400).json({message: "Member not found"});
        }
        const rows = await models.RetirementRecords.findAll({
            where: {memberid: member.pk},
            order: [["pk", "DESC"]],
        });
        res.status(200).json(rows.map((r) => ({
            code: r.pk,
            amount: r.amount,
            date: r.date,
            txid: r.txid,
        })));
    } catch (e) {
        console.log(e.message || e);
        res.status(400).json({message: "error"});
    }
});

app.get("/api/retirement-total", async (req, res) => {
    try {
        const balance = await algotxns.balanceOf(algodClient, retirement_address, assetID);
        res.send({total: toHuman(balance.balance || 0)});
    } catch (e) {
        console.log(e.message);
        res.status(400).json({message: "error"});
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

      // The signer address comes from the signed transaction itself, not
      // anything the client claims - algod rejects the broadcast below if
      // the signature doesn't actually belong to that address, so a
      // successful submit is proof this address authenticated.
      const decoded = algosdk.decodeSignedTransaction(rawSignedTxn);
      const address = algosdk.encodeAddress(decoded.txn.from.publicKey);

      const xtx = await algodClient.sendRawTransaction(rawSignedTxn).do();
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, xtx.txId, 4);

      res.status(200).json({
        message: 'Transaction submitted successfully',
        txId: xtx.txId,
        confirmedRound: confirmedTxn['confirmed-round'],
        token: signSessionToken(address),
        address,
      });
    } catch (error) {
      console.error(error);
      const friendly = friendlyChainError(error);
      res.status(friendly ? 400 : 500).json({ error: friendly || 'Internal server error' });
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
