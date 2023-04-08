const express = require("express");
const router = express.Router();
const initModels = require("../models/init-models");
const sequelise = require("../config/db");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("../utils/statuses");


router.post("/register", (req, res) => {
    const data = {
        companyname: req.body.companyname,
        walletaddress: req.body.walletaddress,
        membertype: req.body.membertype,
        ...(req.body.membertype === 'seller' && {projectid: req.body.projectid}),
        ...(req.body.membertype === 'buyer' && {taxid: req.body.taxid}),
        email: req.body.email
    };

    models.RegisteredMembers.create(data)
        .then((data) => {
            // console.log(data.dataValues.pk);
            res
                .status(200)
                .json({message: "success", memberid: data.dataValues.pk});
        })
        .catch((err) => {
            res.status(400).json({message: err});
        });
});

router.post("/requestcredit", async (req, res) => {
    const hasPending = await models.CreditRequests.findOne({
        where: {
            memberid: req.body.memberid,
            status: statuses.PENDING
        }
    })
    // console.log(hasPending)

    if (hasPending){
        res.status(400).send('You already have a pending request')
    } else {
        const data = {
            memberid: req.body.memberid,
            date: req.body.date,
            status: statuses.PENDING,
        };

        models.CreditRequests.create(data)
            .then((_) => {
                res.status(200).json({message: "success"});
            })
            .catch((err) => {
                res.status(400).json({message: "error", error: err});
            });
    }
});

router.post("/myrequests", (req, res) => {
    models.CreditRequests.findAll({
        where: {
            memberid: req.body.memberid
        },
        include: [{model: models.RegisteredMembers}],
    })
        .then((rows) => {
            let result = [];
            rows.forEach((r) => {
                result.push({
                    code: r.pk,
                    memberid: r.memberid,
                    companyname: r.registeredmember.companyname,
                    wallet: r.registeredmember.walletaddress,
                    projectid: r.registeredmember.projectid,
                    amount: r.amount,
                    status: r.status,
                    date: r.date
                });
            });
            res.status(200).json(result);
        })
        .catch((err) => {
            res.status(400).json({message: "error", error: err});
        });
});

router.post("/registrationdata", async (req, res) => {
    try {
        const member = await models.RegisteredMembers.findOne({
            where: {walletaddress: req.body.walletaddress},
        });
        // console.log(member)
        res.send({
            membertype: member.membertype,
            projectid: member.projectid,
            taxid: member.taxid
        });
    } catch (e) {
        console.log(e)
        res.status(400).send({error: e, message: "Unexpected error occurred 😤"});
    }
});

router.post("/delete", async (req, res) => {
    try {
        await models.CreditRequests.destroy(
            {
                where: {
                    memberid: req.body.memberid,
                    pk: req.body.code
                },
            }
        );
        res.status(200).json({message: "Deleted"});
    } catch (e) {
        console.log(e.message)
        res.status(400).json({message: " "})
    }
});

module.exports = router;
