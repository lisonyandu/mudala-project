// Pins a file buffer to IPFS via Pinata, using the JWT already sitting in
// .env.local. Returns a gateway URL the regulator can open directly.
async function pinFileToIPFS(buffer, filename, mimetype) {
    const jwt = process.env.PINATA_API_JWT;
    if (!jwt) {
        throw new Error("PINATA_API_JWT is not set in .env.local");
    }

    const form = new FormData();
    form.append("file", new Blob([buffer], {type: mimetype}), filename);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        body: form,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Pinata upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}

module.exports = {pinFileToIPFS};
