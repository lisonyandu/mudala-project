const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");
const algosdk = require('algosdk');
// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerUi = require('swagger-ui-express');
const {algod, indexer,algoWeb3} = require('algosdk');
// const Web3 = require("web3");
const fs = require("fs");


var CarbonCreditToken;
var accounts;


const initModels = require("./models/init-models");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("./utils/statuses");
const carbonToken = require('./carbon_credit_token/marketplace');
// const PORT = process.env.PORT || 3001;
// const HOST = "0.0.0.0";

const token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const server = "http://localhost";
const port = 4003;

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


async function getCarbonCreditTokenBalance() {
    const assetID = await createCarbonCreditToken();
    const accountInfo = await algodclient.accountInformation(accounts[0]).do();
    const balance = accountInfo.assets[assetID] ? accountInfo.assets[assetID].amount : 0;
    return balance / 10 ** 18;
  }
  async function getTotalCarbonCreditTokenSupply() {
    const totalSupply = await CarbonCreditToken.methods.totalSupply().call();
    return totalSupply / 10 ** 18;
  }

  app.get("/api/validator", async (req, res) => {
    const balance = await getCarbonCreditTokenBalance();
    const totalSupply = await getTotalCarbonCreditTokenSupply();
    console.log(`Carbon Credit Token balance: ${balance}`);
    console.log(`Carbon Credit Token total supply: ${totalSupply}`);
    res.send({
      balance,
      totalSupply,
    //   wallet: accounts[0],
    });
  });

// app.get("/api/validator", async (req, res) => {
//     const balance = await carbon_token.createCarbonCreditToken;
//     const total = await CarbonCreditToken.methods.totalSupply().call();
//     res.send({
//         totalsupply: total / 10 ** 18,
//         balance: balance / 10 ** 18,
//         wallet: accounts[0],
//     });
// });

// app.get("/api/totalsupply", async (req, res) => {
//     try {
//         const val = await CarbonCreditToken.methods.totalSupply().call();
//         res.send({balance: val / 10 ** 18});
//     } catch (e) {
//         console.log(e.message)
//     }
// });

// app.get("/api/balance", async (req, res) => {
//     try {
//         const val = await CarbonCreditToken.methods
//             .balanceOf(req.body.address)
//             .call();
//         res.send({balance: val / 10 ** 18});
//     } catch (e) {
//         console.log(e.message)
//     }
// });

// app.post("/api/myaccount", async (req, res) => {
//     try {
//         const member = await models.RegisteredMembers.findOne({
//             where: {pk: req.body.memberid},
//         });
//         const val = await CarbonCreditToken.methods
//             .balanceOf(member.walletaddress)
//             .call();
//         res.send({
//             balance: val / 10 ** 18,
//             membertype: member.membertype,
//             projectid: member.projectid,
//             taxid: member.taxid
//         });
//     } catch (e) {
//         res.status(400).send({error: e, message: "Unexpected error occurred 😤"});
//     }
// });

// app.post("/api/transfer", async (req, res) => {
//     try {
//         // console.log(req.body.address);
//         const gasPrice = await web3.eth.getGasPrice();
//         const tokenTransferResult = await CarbonCreditToken.methods
//             .transfer(
//                 req.body.walletaddress,
//                 web3.utils.toWei(req.body.amount.toString(), "ETHER")
//             )
//             .send({
//                 from: accounts[0],
//                 gasPrice,
//             });
//         // console.log(req.body.memberid);

//         await models.CreditRequests.update(
//             {
//                 status: statuses.APPROVED,
//             },
//             {
//                 where: {
//                     memberid: req.body.memberid,
//                     pk: req.body.code
//                 },
//             }
//         );

//         res.status(200).json("done");
//     } catch (e) {
//         console.log(e)
//         res.status(400).json({message: e});
//     }
// });

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
        // networkId = await web3.eth.net.getId();
        // contractAddress = artifact.networks[networkId].address;

        // // console.log(`address ${contractAddress}`);
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
        app.listen(port);
        console.log(`App running on ${server}:${port}`);
    })
    .catch((err) => console.log("Error synching models: " + err));

module.exports = app;


// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
