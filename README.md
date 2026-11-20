# Buxin Store — WhatsApp E-commerce Starter

A static HTML, CSS, and vanilla JavaScript storefront with product details, cart management, and WhatsApp checkout.

## Run locally
For the simplest preview, open `index.html` in a browser. For best compatibility, use a static local server (for example, VS Code Live Server).

## First setup
1. Open `js/config.js`.
2. Change `storeName`.
3. Change `whatsappNumber` to your WhatsApp number in international format, digits only (example: `2207741187`).
4. Change `demoAdminPassword` before testing. The current password is `buxin1`.
5. Open `admin-login.html` and sign in.
6. Add/edit/delete products in the admin dashboard.
7. Optionally configure Cloudinary cloud name and unsigned upload preset to upload product images from the dashboard.

## Demo admin access
- Page: `admin-login.html`
- Password: `buxin1`

**Security warning:** This is a frontend-only demo login. The password is visible in `js/config.js` and is not secure. Do not publish this demo admin page as a protected production dashboard.

## Neon database (cloud source of truth)
Product names, prices, images, WhatsApp settings, shipping, price rules, and Gambia marks live in Neon Postgres.

1. Put your connection string in a local `.env` file as `DATABASE_URL=...` (this file is gitignored — never commit it, never put it in frontend JS).
2. Create tables + upload local catalogue: `python _neon_migrate.py`
3. Download Neon → local static files before PUSH: `python _neon_pull.py`

The public GitHub Pages site still reads `js/products-data.js` and `js/store-data.js`. Neon is the cloud house; pull, then PUSH, so visitors get the same data.

## Browser LocalStorage note
Admin edits in the browser are still local until you lock/pull them into the published JS files (and Neon). Clearing browser data removes only those local drafts.

## Cloudinary
Create a Cloudinary unsigned upload preset and enter its cloud name and preset in Admin > Image hosting. Do not expose your Cloudinary API secret. Unsigned uploads should be configured with appropriate restrictions in Cloudinary.

## Product catalogue
Products load from `js/products-data.js`. Photos are in `assets/products/`. Kit prices stored in USD are turned into rupees with `usdToInr`, then shown in Gambian dalasi with `inrToGmd` in `js/config.js`. Products with no supplier price show "Ask for price".

## WhatsApp checkout
Buy Now and cart checkout open WhatsApp with a prefilled message. The customer must press Send in WhatsApp. No online payment is taken.

## Supplier intake
Share `supplier.html` privately with suppliers (no password). They enter their name, then add products one by one. Review submissions in Admin → Suppliers (`admin-suppliers.html`). Admin pages are not linked from the public storefront; open them by URL only.

## Admin access
Open `admin-login.html` directly. The public site footer does not show an Admin link.
