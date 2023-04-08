const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");

// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerUi = require('swagger-ui-express');
const {algod, indexer,algoWeb3} = require('algosdk');
const Web3 = require("web3");
const fs = require("fs");

const artifactJson = "build/contracts/CarbonCreditToken.json";
const artifact = JSON.parse(fs.readFileSync(artifactJson));
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var CarbonCreditToken;
var accounts;
var networkId;
var contractAddress;

const initModels = require("./models/init-models");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("./utils/statuses");

const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const server = "http://localhost";
const port = 4001;


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
    const balance = await CarbonCreditToken.methods.balanceOf(accounts[0]).call();
    const total = await CarbonCreditToken.methods.totalSupply().call();
    res.send({
        totalsupply: total / 10 ** 18,
        balance: balance / 10 ** 18,
        wallet: accounts[0],
    });
});

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

app.post("/api/transfer", async (req, res) => {
    try {
        // console.log(req.body.address);
        const gasPrice = await web3.eth.getGasPrice();
        const tokenTransferResult = await CarbonCreditToken.methods
            .transfer(
                req.body.walletaddress,
                web3.utils.toWei(req.body.amount.toString(), "ETHER")
            )
            .send({
                from: accounts[0],
                gasPrice,
            });
        // console.log(req.body.memberid);

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

// app.post("/api/mint", async (req, res) => {
//     try {
//         await CarbonCreditToken.methods
//             .mint(BigInt(req.body.amount * 10 ** 18))
//             .send({from: accounts[0]});
//         const val = await CarbonCreditToken.methods.totalSupply().call();
//         res.send({balance: val});
//     } catch (e) {
//         console.log(e.message)
//         res.status(400).json({message: " "})
//     }
// });

sequelise
    .authenticate()
    .then(async () => {
        console.log("Database connected...");
        accounts = await web3.eth.getAccounts();
        networkId = await web3.eth.net.getId();
        contractAddress = artifact.networks[networkId].address;

        // console.log(`address ${contractAddress}`);
        CarbonCreditToken = new web3.eth.Contract(artifact.abi, contractAddress, {
            from: accounts[0],
        });
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
