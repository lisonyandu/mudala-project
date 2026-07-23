# Mudala Exchange

Mudala is a carbon offsetting exchange solution powered by Algorand blockchain technology.

![Screenshot 2023-10-26 095524](https://github.com/lisonyandu/mudala-project/assets/51886336/486cd92b-c768-4889-97c0-bdfb1e34264b)


# Tech Stack

* `Express`
* `Sequelize` + `SQLite`
* `Algorand javascript sdk`

The frontend (Vue) lives in a separate repo: `mudala-frond-end`.

## Installation

```
npm install
```

## Setup

No local Algorand node or Docker sandbox is required. This project talks to
the public Algorand TestNet through [AlgoNode](https://algonode.io) (free,
no API key needed).

Populate `.env.local` in the project root:

```
NODE_ENV=development
PORT=3000

NEXT_PUBLIC_NETWORK="TestNet"

NEXT_PUBLIC_ALGOD_ADDRESS_TESTNET="https://testnet-api.algonode.cloud"
NEXT_PUBLIC_ALGOD_TOKEN_TESTNET=""
NEXT_PUBLIC_ALGOD_PORT_TESTNET=""

NEXT_PUBLIC_INDEXER_ADDRESS_TESTNET="https://testnet-idx.algonode.cloud"
NEXT_PUBLIC_INDEXER_TOKEN_TESTNET=""
NEXT_PUBLIC_INDEXER_PORT_TESTNET=""

# Regulator account (mints/approves credits) and its reserve account
NEXT_PUBLIC_REGULATOR_ADDR=
NEXT_PUBLIC_REGULATOR_MNEMONIC=
NEXT_PUBLIC_REGULATOR_ADDR_2=
NEXT_PUBLIC_REGULATOR_MNEMONIC_2=

# Mudala Exchange account (mediates marketplace buy/sell)
NEXT_PUBLIC_EXCHANGE_ADDR=
NEXT_PUBLIC_EXCHANGE_MNEMONIC=
NEXT_PUBLIC_CCT_PRICE_ALGO=0.1

NEXT_PUBLIC_FT_ASSET_ID=
```

All of the above are TestNet-only accounts/keys. Never put MainNet mnemonics
in this file, and don't commit real production secrets to `.env.local`.

Before the marketplace can trade, the exchange account needs to opt into the
CCT asset and hold some starting balance. Run once per environment:

```
npm run setup:exchange -- 100
```

(the number is how much CCT to seed it with; it also opts the account into
the asset if it hasn't already).

Then start the backend:

```
npm run dev
```

The API will be accessible on `http://localhost:3000`. Run the frontend
separately from the `mudala-frond-end` repo (`npm run serve`, on
`http://localhost:8080` by default) — its dev server proxies `/api`,
`/member` and `/validator` calls back to this backend.

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
