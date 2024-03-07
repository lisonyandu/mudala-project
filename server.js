const express = require("express");
const cors = require("cors");
const sequelise = require("./config/db");
const memberRouter = require("./routes/member");
const validatorRouter = require("./routes/validator");

require('dotenv').config({ path: "C:/Users/User/Desktop/mudala-back-end/.env.local" });
const algosdk = require('algosdk');
const algotxns = require("C:/Users/User/Desktop/mudala-back-end/algorand/index.js");


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


const getAlgodClient = require("C:/Users/User/Desktop/mudala-back-end/clients/index.js");
// sandbox  local
const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient.getAlgodClient(network)


const regulator_address = process.env.NEXT_PUBLIC_REGULATOR_ADDR
const vendor_address = process.env.NEXT_PUBLIC_VENDOR_ADDR
const regulator = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC);
const regulator_2 = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_REGULATOR_MNEMONIC_2);
const assetID = parseInt(process.env.NEXT_PUBLIC_FT_ASSET_ID);



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

        const xtxn = await algotxns.getPaymentTxn(algodClient, regulator.addr, req.body.walletaddress,assetID,req.body.amount);
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
// Example backend route (express.js)

app.post('/api/authenticate', async (req, res) => {
    try {
      const { accountAddress } = req.body;
  
      // Validate address (ensure this is correct for algosdk validation)
      if (!algosdk.isValidAddress(accountAddress)) {
        return res.status(400).json({ error: 'Invalid Algorand address' });
      }
  
    // Get the unsigned transaction (Allow 'amount: 0' for your logic)
    const xtxn = await algotxns.getPaymentTxn(algodClient, accountAddress, vendor_address, assetID, 0);
    console.log("Transaction before encoding: ",xtxn)
    // Success Response: Distinguish Zero Algo Transactions
    const encodedTxn = algosdk.encodeObj([xtxn]);

    console.log("Transaction after encoding: ",encodedTxn)
    res.set('Content-Type', 'application/octet-stream');
    res.send({ txn: encodedTxn, isZeroAlgoTransaction: true }); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


app.post('/api/submitTransaction', async (req, res) => {
    try {
      const { signedTxn } = req.body;
  

      console.log(signedTxn)
      // Validate signed transaction
    //   if (!algosdk.isv(signedTxn)) {
    //     return res.status(400).json({ error: 'Invalid signed transaction' });
    //   }
  
      // Submit the signed transaction to the Algorand network
      const result = await algodClient.sendRawTransaction(signedTxn).do();
      console.log("Submitting transaction to the network!")
      // Respond with the result
      res.status(200).json({ message: 'Transaction submitted successfully', result });
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
