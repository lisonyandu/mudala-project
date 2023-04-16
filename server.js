const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");
const algosdk = require('algosdk');
const {algod, indexer,algoWeb3} = require('algosdk');
const fs = require("fs");
const { Account } = require('algosdk');
require('dotenv').config();


const initModels = require("./models/init-models");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("./utils/statuses");
const marketplace = require('./carbon_credit_token/marketplace');
const carbonToken = require('./carbon_credit_token/carbonCreditToken');

// const apiKey = process.env.TESTNET_ALGOD_API_KEY;
// const token = process.env.DEV_ALGOD_API_KEY;
// const server = process.env.DEV_ALGOD_SERVER;
// const port = process.env.DEV_ALGOD_PORT;
const PORT = process.env.PORT;
const HOST = "0.0.0.0";
const algodServer = process.env.TESTNET_ALGOD_SERVER;
// sandbox
const token = { 'X-API-Key': process.env.TESTNET_ALGOD_API_KEY }; // for local environment use const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const server = process.env.TESTNET_ALGOD_SERVER; //for local environment use 'http://localhost', for TestNet use PureStake "https://testnet-algorand.api.purestake.io/ps2" or AlgoExplorer "https://api.testnet.algoexplorer.io",
const port = process.env.TESTNET_ALGOD_PORT; // for local environment use 4001;

let algodclient = new algosdk.Algodv2(token, server, port);


const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors());
app.get("/", (req, res) => {
    res.send("Welcome the API is running");
});

app.use("/member", memberRouter);
app.use("/validator", validatorRouter);
const axios = require('axios');

var accounts;

// async function getBlock(blockNumber) {
//   try {
//     const response = await axios.get(`${algodServer}/v2/blocks/${blockNumber}`, { headers });
//     return response.data;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

// getBlock(1)
//   .then((data) => console.log(data))
//   .catch((error) => console.error(error));

const reg_addr = process.env.ACCOUNT1_ADDRESS

app.get("/api/validator", async (req, res) => {
    const assetID = await carbonToken.createCarbonCreditToken(reg_addr);
    console.log(assetID);
    const balance = await carbonToken.balanceOf(algodclient, reg_addr, assetID.assetID);
    console.log(balance);
    const total = await carbonToken.totalSupply(algodclient, reg_addr, assetID.assetID);
    console.log(total);
    res.send({
      totalsupply: total.total_supply,
      balance: balance.balance,
      wallet: reg_addr,
    });
  });
  

app.get("/api/totalsupply", async (req, res) => {
    try {
        const assetID = await carbonToken.createCarbonCreditToken(reg_addr);
        const val = await carbonToken.totalSupply(algodclient, reg_addr, assetID.assetID);
        res.send({balance: val});
    } catch (e) {
        console.log(e.message)
    }
});

app.get("/api/balance", async (req, res) => {
    try {
        const assetID = await carbonToken.createCarbonCreditToken(reg_addr);
        const val = await carbonToken.balanceOf(algodclient, reg_addr, assetID.assetID)
            .balanceOf(req.body.address)
        res.send({balance: val});
    } catch (e) {
        console.log(e.message)
    }
});

app.post("/api/myaccount", async (req, res) => {
    try {
        const assetID = await marketplace.createCarbonCreditToken(reg_addr);
        const member = await models.RegisteredMembers.findOne({
            where: {pk: req.body.memberid},
        });
        const val = await marketplace.balanceOf(algodclient,member.walletaddress,assetID.assetID)
        res.send({
            balance: val,
            membertype: member.membertype,
            projectid: member.projectid,
            taxid: member.taxid
        });
    } catch (e) {
        res.status(400).send({error: e, message: "Unexpected error occurred 😤"});
    }
});

sequelise
  .authenticate()
  .then(async () => {
    console.log("Database connected...");
    const accounts = await algodclient.accounts;
    console.log('Account info:', accounts);
    // Do something with the accounts data here...
  })
  .catch((err) => {
    console.log("Error connecting to database: " + err);
  });

sequelise
    .sync()
    .then(() => {
        app.listen(PORT);
        console.log(`App running on ${server}:${PORT}`);
    })
    .catch((err) => console.log("Error synching models: " + err));

module.exports = app;
