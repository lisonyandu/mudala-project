const express = require("express");
const router = express.Router();
const initModels = require("../models/init-models");
const sequelise = require("../config/db");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("../utils/statuses");

router.get("/creditrequests", (req, res) => {
    models.CreditRequests.findAll({
        include: [{model: models.RegisteredMembers}],
        where: {
            status: 'pending'
        }
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

router.post("/decline", async (req, res) => {
    try {
        await models.CreditRequests.update(
            {
                status: statuses.DECLINED,
            },
            {
                where: {
                    memberid: req.body.memberid,
                    pk: req.body.code
                },
            }
        );
        res.status(200).json({message: "declined"});
    } catch (e) {
        console.log(e.message)
        res.status(400).json({message: " "})
    }
});

module.exports = router;
