const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");

require('dotenv').config();
const algosdk = require('algosdk');
// const marketplace = require('./carbon_credit_token/marketplace');
const carbonToken = require('./carbon_credit_token/carbonCreditToken');


// const Web3 = require("web3");
const fs = require("fs");


// const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
// var CarbonCreditToken;
var accounts;
// var assetID;
const assetID = 212175420;

const initModels = require("./models/init-models");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("./utils/statuses");

// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT;
const HOST = "0.0.0.0";
// // sandbox
// const token = { 'X-API-Key': process.env.TESTNET_ALGOD_API_KEY }; // for local environment use const token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
// const server = process.env.TESTNET_ALGOD_SERVER; //for local environment use 'http://localhost', for TestNet use PureStake "https://testnet-algorand.api.purestake.io/ps2" or AlgoExplorer "https://api.testnet.algoexplorer.io",
// const port = process.env.TESTNET_ALGOD_PORT; // for local environment use 4001;

// sandbox  local
const token = process.env.DEV_ALGOD_API_KEY;
const server = process.env.DEV_ALGOD_SERVER;
const port = process.env.DEV_ALGOD_PORT;
let algodclient = new algosdk.Algodv2(token, server, port);

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

const regulator_address = process.env.ACCOUNT1_ADDRESS
const assetID_2 = process.env.assetID_2

app.get("/api/validator", async (req, res) => {
  // const assetID = await carbonToken.createCarbonCreditToken(regulator_address);
  // console.log(assetID);
  const balance = await carbonToken.balanceOf(algodclient, regulator_address, assetID);
  console.log(balance);
  const total = await carbonToken.totalSupply(algodclient, regulator_address, assetID);
  console.log(total);
  res.send({
    totalsupply: total.total_supply,
    balance: balance.balance,
    wallet: regulator_address,
  });
});

app.get("/api/totalsupply", async (req, res) => {
    try {
        // const val = await CarbonCreditToken.methods.totalSupply().call();
        const val = await carbonToken.totalSupply(algodclient, regulator_address, assetID.assetID);
        res.send({balance: val});
    } catch (e) {
        console.log(e.message)
    }
});

app.get("/api/balance", async (req, res) => {
    try {
        // const val = await CarbonCreditToken.methods
        // const val = carbonToken.balanceOf(req.body.address)
        console.log(member.walletaddress)
        const val = await carbonToken.balanceOf(algodclient, member.walletaddress, assetID);
        console.log(val)
        //     .call();
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
    
            // console.log(member.walletaddress)
            const val = await carbonToken.balanceOf(algodclient, member.walletaddress, assetID);
            // console.log(val)
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
        // console.log(req.body.address);
        // const gasPrice = await web3.eth.getGasPrice();
        // const tokenTransferResult = await CarbonCreditToken.methods
        //     .transfer(
        //         req.body.walletaddress,
        //         web3.utils.toWei(req.body.amount.toString(), "ETHER")
        //     )
        //     .send({
        //         from: accounts[0],
        //         gasPrice,
        //     });
        // console.log(req.body.memberid);
        // const vendor_address = process.env.
        await carbonToken.optInAsset('seller');

        console.log("seller address", req.body.walletaddress)
        console.log("credit amount", req.body.amount)
        await carbonToken.transferCredits(algodclient, req.body.walletaddress, req.body.amount);

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
        // await CarbonCreditToken.methods
        //     .mint(BigInt(req.body.amount * 10 ** 18))
        //     .send({from: accounts[0]});+
        console.log("Lets Mint some more tokens")
        const val1 = await carbonToken.mintTokens(algodclient, parseInt( req.body.amount));
        console.log("Success mint?", val1)
        const bal = await carbonToken.balanceOf(algodclient, regulator_address, assetID);
        console.log("Balance of Regulator as of now",bal)
        const val = await carbonToken.totalSupply(algodclient, regulator_address, assetID);
        console.log("Blance after minting", val)
        res.send({amount: val1
                // balance: bal
        });
    } catch (e) {
        console.log(e.message)
        res.status(400).json({message: " "})
    }
});

sequelise
    .authenticate()
    .then(async () => {
        console.log("Database connected...");
        const accounts = await algodclient.accounts;
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


// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
