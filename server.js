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

const apiKey = process.env.TESTNET_ALGOD_API_KEY;
const token = process.env.DEV_ALGOD_API_KEY;
const server = process.env.DEV_ALGOD_SERVER;
const port = process.env.DEV_ALGOD_PORT;
const PORT = process.env.PORT;
const algodServer = process.env.TESTNET_ALGOD_SERVER;
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
const headers = {
  'X-API-Key': apiKey,
};

let algodclient = new algosdk.Algodv2(token, server, port);

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


app.get("/api/totalsupply", async (req, res) => {
    try {
        const val = await CarbonCreditToken.methods.totalSupply().call();
        res.send({balance: val / 10 ** 18});
    } catch (e) {
        console.log(e.message)
    }
});

app.get("/api/balance", async (req, res) => {
    try {
        const val = await CarbonCreditToken.methods
            .balanceOf(req.body.address)
            .call();
        res.send({balance: val / 10 ** 18});
    } catch (e) {
        console.log(e.message)
    }
});

app.post("/api/myaccount", async (req, res) => {
    try {
        const member = await models.RegisteredMembers.findOne({
            where: {pk: req.body.memberid},
        });
        const val = await CarbonCreditToken.methods
            .balanceOf(member.walletaddress)
            .call();
        res.send({
            balance: val / 10 ** 18,
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
    const accounts = await Account.findAll();
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
