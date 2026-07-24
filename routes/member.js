const express = require("express");
const multer = require("multer");
const router = express.Router();
const initModels = require("../models/init-models");
const sequelise = require("../config/db");
const models = initModels(sequelise);
const {Sequelize} = require("sequelize");
const statuses = require("../utils/statuses");
const {requireWallet} = require("../middleware/auth.js");
const {pinFileToIPFS} = require("../utils/pinata.js");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 10 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        const allowed = ["application/pdf", "image/png", "image/jpeg"];
        cb(null, allowed.includes(file.mimetype));
    },
});

async function findMemberByWallet(walletaddress) {
    return models.RegisteredMembers.findOne({where: {walletaddress}});
}

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

router.post("/requestcredit", requireWallet, upload.single("certificate"), async (req, res) => {
    try {
        const member = await findMemberByWallet(req.walletAddress);
        if (!member) {
            return res.status(400).json({message: "Member not found"});
        }

        if (!req.file) {
            return res.status(400).json({message: "A certificate (PDF, PNG or JPG) is required"});
        }

        const hasPending = await models.CreditRequests.findOne({
            where: {
                memberid: member.pk,
                status: statuses.PENDING
            }
        })

        if (hasPending) {
            return res.status(400).send('You already have a pending request')
        }

        const certificateurl = await pinFileToIPFS(req.file.buffer, req.file.originalname, req.file.mimetype);

        const data = {
            memberid: member.pk,
            date: req.body.date,
            status: statuses.PENDING,
            certificateurl,
        };

        await models.CreditRequests.create(data);
        res.status(200).json({message: "success"});
    } catch (err) {
        console.log(err.message || err);
        res.status(400).json({message: err.message || "error"});
    }
});

router.post("/myrequests", requireWallet, async (req, res) => {
    const member = await findMemberByWallet(req.walletAddress);
    if (!member) {
        return res.status(400).json({message: "Member not found"});
    }

    models.CreditRequests.findAll({
        where: {
            memberid: member.pk
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
                    date: r.date,
                    certificateurl: r.certificateurl,
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
            taxid: member.taxid,
            walletaddress: member.walletaddress,
            memberid: member.pk
        });
    } catch (e) {
        console.log(e)
        res.status(400).send({error: e, message: "Unexpected error occurred 😤"});
    }
});

router.post("/delete", requireWallet, async (req, res) => {
    try {
        const member = await findMemberByWallet(req.walletAddress);
        if (!member) {
            return res.status(400).json({message: "Member not found"});
        }
        await models.CreditRequests.destroy(
            {
                where: {
                    memberid: member.pk,
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
