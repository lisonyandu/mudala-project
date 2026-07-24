const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in .env.local");
}

function signSessionToken(address) {
    return jwt.sign({address}, JWT_SECRET, {expiresIn: "12h"});
}

// Requires a valid session token and trusts ONLY the address it carries -
// req.walletAddress is derived from a signature algod already verified when
// the token was issued, never from anything the client claims in the body.
function requireWallet(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({message: "Connect and sign in with your wallet first"});
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.walletAddress = payload.address;
        next();
    } catch (e) {
        return res.status(401).json({message: "Session expired, please reconnect your wallet"});
    }
}

// Must run after requireWallet. Single-operator allowlist, not real RBAC.
function requireRegulator(req, res, next) {
    const operator = process.env.NEXT_PUBLIC_REGULATOR_OPERATOR_ADDR;
    if (!req.walletAddress || !operator || req.walletAddress !== operator) {
        return res.status(403).json({message: "Regulator access only"});
    }
    next();
}

module.exports = {signSessionToken, requireWallet, requireRegulator};
