# Mudala Roadmap

Captured from a design review after the frontend rebuild (2026-07-24). Ordered
by priority within each track; not all of it is scheduled, this is a menu.

## Application

1. ~~**Session auth**~~ — done, see design notes below.
2. ~~**Market-driven price**~~ — done. Went with seller-set listings (like a
   marketplace, not a matching-engine order book — simpler to build
   correctly, still real price discovery instead of one fixed constant). See
   design notes below.
3. **Certificate documents on credit requests** — sellers submit a free-text
   project ID today; attaching the actual offset certificate (PDF/image)
   would strengthen the verification story. Pinata (IPFS pinning) API keys
   are already sitting unused in `.env.local` from earlier work — natural
   fit.
4. **Automated tests** — zero test coverage in either repo.
5. **A real deployment path** — the GitHub Actions workflows in the frontend
   repo don't build the Vue SPA, and there's no hosting decision made for the
   backend/SQLite yet.

## Business

1. **Cross-reference or partner with an accredited registry** (Verra, Gold
   Standard, or South Africa's own Credible Carbon) so credibility doesn't
   rest on "trust the regulator" alone — directly addresses the paper's own
   noted limitation.
2. **Rethink the 1% flat fee** — thin margin; consider a seller listing fee
   or a verification-service fee charged to regulators/auditors instead.
3. **One real pilot project** beats synthetic test data for any credibility
   claim, thesis defense included.
4. **Legal/regulatory engagement in South Africa** (carbon tax treatment,
   FSCA sandbox) — already future work in the paper; a lightweight legal
   opinion would differentiate this before going further.

## Session auth — design notes

- `/api/submitTransaction` (used by the existing wallet-auth flow) now
  decodes the *signed* transaction to recover the real sender address
  (can't be spoofed — algod already validated the signature) and mints a
  short-lived JWT for that address.
- The frontend wallet store attaches it as `Authorization: Bearer <token>`
  on every request after connecting.
- A `requireWallet` middleware protects member-scoped endpoints and
  substitutes the verified address for whatever the client claims.
- A `requireRegulator` middleware additionally checks the verified address
  against a single allowlisted `NEXT_PUBLIC_REGULATOR_OPERATOR_ADDR`, and
  gates `/regulator` and its backing endpoints.
- This is a single shared-secret allowlist, not a real multi-admin RBAC
  system — fine for one operator (a thesis prototype), not for a team.

## Seller-set listings — design notes

- `Listings` (pk, memberid, amount, pricealgo, status, escrowtxid): a seller
  escrows CCT into the exchange account at listing time (same prepare/sign/
  submit pattern as everything else) and sets their own ALGO-per-CCT price.
  `amount` is decremented as the listing fills; the listing goes `filled`
  when it hits zero, or `cancelled` if the seller pulls it (exchange
  refunds the remaining escrowed CCT back to them).
- Buyers browse `GET /api/market/listings` (all active listings, any
  seller) and buy against a specific one, optionally partially. On
  purchase, the exchange releases CCT to the buyer and ALGO (minus the 1%
  broker fee) to *that listing's* seller — not a shared pool average.
- `NEXT_PUBLIC_CCT_PRICE_ALGO` still exists as a suggested default shown when
  a seller creates a listing, but nothing enforces it anymore.
