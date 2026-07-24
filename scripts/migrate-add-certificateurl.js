// One-off migration: sequelize.sync() only creates tables that don't exist
// yet, it won't add a column to an existing one. creditrequests already
// exists with real test data, so add the new column with a direct ALTER
// TABLE instead of reaching for sync({alter: true}) (which re-diffs every
// table on every boot and is riskier than a single targeted statement).
//
// Usage: node scripts/migrate-add-certificateurl.js

require("dotenv").config({path: "./.env.local"});
const sequelise = require("../config/db");

(async () => {
    const [results] = await sequelise.query("PRAGMA table_info(creditrequests);");
    const hasColumn = results.some((col) => col.name === "certificateurl");
    if (hasColumn) {
        console.log("certificateurl already exists on creditrequests, nothing to do.");
        return;
    }
    await sequelise.query("ALTER TABLE creditrequests ADD COLUMN certificateurl VARCHAR(255);");
    console.log("Added certificateurl column to creditrequests.");
})().catch((err) => {
    console.error(err);
    process.exit(1);
}).finally(() => sequelise.close());
