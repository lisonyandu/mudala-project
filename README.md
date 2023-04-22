# Mudala Exchange

Mudala is a carbon offsetting exchange solution powered by Algorand blockchain technology.

# Tech Stack

* `Express`
* `Vue`
* `Algorand javascript sdk`

## Installation

Install project dependencies

- npm install
- cd client
- npm install

# Setup

Sandbox

Open docker and run

`$ ./sandbox up`

Backend

Run this command in the root folder

`$ npm run dev`

The API will be accessible on `http://localhost:3000`

Frontend

Navigate to client folder

`$ cd client`

`$ npm run serve`

Populate `.env` file for your environment variables

```

NODE_ENV=development
PORT=3000
BLOCKCHAINENV=TESTNET
DEV_ALGOD_API_KEY=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
DEV_ALGOD_SERVER=http://localhost
DEV_ALGOD_PORT=4001
DEV_ALGOINDEXER_PORT=8980
TESTNET_ALGOD_API_KEY=PLEASE_REPLACE_ME
TESTNET_ALGOD_SERVER=https://testnet-algorand.api.purestake.io/ps2
TESTNET_ALGOINDEXER_SERVER=https://testnet-algorand.api.purestake.io/idx2
TESTNET_ALGOD_PORT=
VENDOR_ADDRESS=PLEASE_REPLACE_ME
REGULATOR_ADDRESS=PLEASE_REPLACE_ME

```

Create a `dbconfig.json` file within the root folder of the project and populate it with the following configuration, replacing blank details with your own.

```
{
  "development": {
    "username": "",
    "password": "",
    "database": "",
    "host": "",
    "dialect": "",
    "logging": true
  },
  "test": {
    "username": "",
    "password": "",
    "database": "",
    "host": "",
    "dialect": "",
    "logging": true
  },
  "production": {
    "username": "",
    "password": "",
    "database": "",
    "host": "",
    "dialect": "",
    "logging": false
  }
}
```
