# Shahnaz Kitchen — Cloud Kitchen Website (MERN + Tailwind)

Two separate web apps in one codebase:

- **Customer site** — `http://localhost:5173/`
  Browse the dummy menu, add items to a cart, choose **home delivery** (with charge) or **self pickup**, pay **cash or online**, place the order, then track it at `/track` with the order code to see the status and the exact preparation time set by the kitchen.
- **Admin site** — `http://localhost:5173/admin`
  Password-protected dashboard for the kitchen owner:
  - See incoming order **requests** (pending → accept or reject, with a reason shown to the customer)
  - Set the **preparation time** when accepting (customer sees it instantly on the tracking page)
  - **Kitchen live/closed switch** — when off, no new orders are accepted anywhere
  - Set the **home delivery charge**
  - Mark accepted orders as **completed**
  - Auto-refreshes every 6 seconds so new requests appear live

## Project layout

```
client/   React 19 + Vite + Tailwind CSS 4 (customer UI + admin UI, routed separately)
server/   Express 5 + Mongoose REST API (MongoDB)
```

## Run it

**Backend** (from `server/`):

```bash
cp .env.example .env        # already done — edit MONGO_URI / ADMIN_PASSWORD as needed
npm run dev:memory          # zero-setup: in-memory MongoDB, menu auto-seeded (18 items)
# or, with real MongoDB/Atlas:
npm run dev
```

**Frontend** (from `client/`, second terminal):

```bash
npm install
npm run dev
```

Open the customer site (home page shows the kitchen live/closed banner), place an order, then open `/admin` and sign in.

## Admin password

Set as `ADMIN_PASSWORD` in `server/.env` — default `shahnaz123`. Change it before real use.

## Notes

- Prices are re-checked server-side on every order so the client cannot submit fake prices.
- Sorry — no real payment gateway: "online" is recorded as a payment choice; hook up Stripe/easypaisa later at checkout.
- Dev-mode uses an ephemeral database; all test orders are wiped when the server restarts.
