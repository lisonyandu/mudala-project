# Changelog

Build log for Mudala's post-thesis work, kept alongside `ROADMAP.md` (what's
next) as a record of what was actually built and why. Newest first.

## Seller-set listings, replacing the fixed CCT price

**What**: `Trade.vue` and the backend `/api/market/*` endpoints were rebuilt
around a `Listings` model - sellers escrow CCT at their own asking price
(`POST /api/market/list/prepare`+`/submit`), buyers browse active listings
from any seller (`GET /api/market/listings`) and buy against a specific one,
optionally partially. On purchase the exchange pays that listing's specific
seller, not an averaged pool. Sellers can cancel an unfilled listing to get
their escrowed CCT back (`POST /api/market/list/cancel`). This replaced the
old fixed-`CCT_PRICE_ALGO` immediate-swap `/api/market/sell` and
`/api/market/buy` endpoints entirely.

**Why**: a single hardcoded ALGO-per-CCT constant isn't a market, and was
next on the roadmap. Chose a listings model over a full bid/ask order book
with a matching engine - meaningfully more work (order storage, matching
logic, partial fills, cancellation, order-book UI) for a thesis prototype
where "real price discovery instead of one number" was the actual goal, not
exchange-grade market microstructure.

## Session auth + regulator gating

**What**: `/api/submitTransaction` now decodes the *signed* transaction to
recover the real signer address (algod already validated the signature, so
this can't be spoofed) and returns a short-lived JWT for that address. The
frontend wallet store attaches it as `Authorization: Bearer <token>` on every
request after connecting, and persists it in `sessionStorage` so a page
refresh doesn't force re-signing. A `requireWallet` middleware
(`middleware/auth.js`) protects every member-scoped endpoint and substitutes
the verified address for whatever the client claims in the request body. A
`requireRegulator` middleware additionally checks the verified address
against a single allowlisted `NEXT_PUBLIC_REGULATOR_OPERATOR_ADDR` and gates
`/regulator` and its backing endpoints (`/api/mint`, `/api/transfer`,
`/validator/*`).

**Why**: before this, nothing tied an API request to the wallet that
authenticated - every mutating endpoint (including `/api/retire`, which can
claw back CCT from any address with no signature required) trusted whatever
`walletaddress`/`memberid` the client sent in the body. `/regulator` had no
gate at all - open by URL, and its backing endpoints were callable directly
with `curl`, no UI needed. This closed both gaps with the same mechanism.

**Known limitation**: this is a single-operator allowlist, not real RBAC.
Fine for one person operating the regulator role; not a team permission
system.

**Note on the operator account**: originally pointed at the existing
`NEXT_PUBLIC_REGULATOR_ADDR` (reusing the account already used server-side
for `/api/transfer`), but in practice the user's Pera app kept connecting
with a different, already-familiar account instead of the newly-imported
one. Rather than fight the import, `NEXT_PUBLIC_REGULATOR_OPERATOR_ADDR` was
pointed at whichever account Pera was actually offering, funded directly.
The lesson: for a solo-operator prototype, gate on "whatever wallet the
human already has open," not on an account they have to go import.

## Frontend rebuild + CCT retirement + decimals fix

**What**:
- Full frontend rebuild on an approved design direction (malachite/brass
  palette, serif+sans+mono type system, light/dark via CSS custom
  properties). Old PrimeVue Sakai admin-template scaffolding
  (`AppTopbar`/`AppMenu`/`AppSubmenu`/`AppConfig`/`AppFooter`) removed
  entirely. Wallet state centralized in Pinia with a single shared
  `PeraWalletConnect` instance, so connecting on one page carries over to
  every other page instead of reconnecting per view.
- New IA: `/` (Landing), `/dashboard` (role-aware overview for buyer/seller),
  `/trade` (unified buy/sell panel with a live conversion line and a
  transaction-status timeline, replacing two disconnected modal dialogs and
  a silent wait during confirmation), `/retire` (new), `/regulator`
  (restyled, same underlying logic).
- CCT retirement: a permanent on-chain sink. The asset's clawback authority
  was still held by the reserve account (`regulator_2`), so retiring credits
  is a clawback transfer into a dedicated `NEXT_PUBLIC_RETIREMENT_ADDR`
  account that never spends back out - no signature needed from the holder,
  same trust model as mint/transfer. `RetirementRecords` model is the
  per-member audit trail; the retirement account's own on-chain balance is
  the source of truth for the platform-wide total (no need to sum DB rows).
- Decimals fix: the CCT asset was created with `decimals: 2`, but every
  endpoint (mint/transfer/buy/sell) and all prior manual testing had treated
  balances as raw whole units, so the app's numbers didn't match what Pera
  Wallet's own UI showed for the same balance (Pera divides by 100 for
  display). Fixed by converting human CCT units to/from base units only at
  the point of building an on-chain transaction (`toBaseUnits`/`toHuman` in
  `server.js`), everywhere else - including every API response - now works
  in human units.

**Why**: the user's read on the original (2023/2024) frontend was that it
was "too basic" with bad UX - dialog-heavy interactions, no persistent
connection state across pages, no feedback during multi-second blockchain
waits, and a generic default PrimeVue theme. The retirement gap was raised
independently: a bought credit could be resold indefinitely with no way to
mark "this ton of CO2 has been claimed," which undercuts the double-counting
story the whole platform is meant to solve. The decimals mismatch was found
during this work, not reported by the user - flagged because a user
comparing the app's balance against their own wallet's balance and seeing
different numbers is a real trust problem for a financial application.

## Restore (see also memory: `mudala-auth-trading-disabled`)

Before the redesign, an earlier session restored wallet authentication and
built marketplace trading from scratch (neither had a working backend
endpoint - the frontend code was either commented out or referenced APIs
that didn't exist), fixed a `/api/transfer` bug where the amount was passed
to algosdk as an unparsed string, and switched the backend from a
Docker/sandbox local-node setup to the public Algorand TestNet via AlgoNode
(free, tokenless), removing the Docker dependency entirely.
