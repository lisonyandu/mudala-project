# Mudala Roadmap

Captured from a design review after the frontend rebuild (2026-07-24). Ordered
by priority within each track; not all of it is scheduled, this is a menu.

## Application

1. **Session auth** — nothing today ties an API request to the wallet that
   authenticated; every mutating endpoint trusts whatever `walletaddress`/
   `memberid` the client sends in the body, and the regulator page/endpoints
   have no gate at all. *(Status: in progress — see below.)*
2. **Real order book / market-driven price** — CCT is currently priced at a
   fixed constant (`NEXT_PUBLIC_CCT_PRICE_ALGO`), not supply and demand.
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
