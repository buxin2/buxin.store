# Buxin Store — WhatsApp E-commerce Starter

A static HTML, CSS, and vanilla JavaScript storefront with product details, cart management, and WhatsApp checkout.

## Run locally
For the simplest preview, open `index.html` in a browser. For best compatibility, use a static local server (for example, VS Code Live Server).

## First setup
1. Open `js/config.js`.
2. Change `storeName`.
3. Change `whatsappNumber` to your WhatsApp number in international format, digits only (example: `919876543210`).
4. Change `demoAdminPassword` before testing. The default is `ChangeMe123!`.
5. Open `admin-login.html` and sign in.
6. Add/edit/delete products in the admin dashboard.
7. Optionally configure Cloudinary cloud name and unsigned upload preset to upload product images from the dashboard.

## Demo admin access
- Page: `admin-login.html`
- Default password: `ChangeMe123!`

**Security warning:** This is a frontend-only demo login. The password is visible in `js/config.js` and is not secure. Do not publish this demo admin page as a protected production dashboard.

## Data storage limitation
This starter stores product data and store settings in browser LocalStorage. This makes the complete user flow testable without a backend, but:
- Products added in one browser are not automatically visible to other visitors.
- Clearing browser data removes locally stored catalogue changes.
- LocalStorage is specific to the browser and device.

To publish a shared catalogue for all visitors while keeping the public site static, connect a secure publishing workflow (such as a GitHub Actions workflow or a small protected publishing service). Keep all write tokens and secrets on the server/CI side, never in browser JavaScript. The public site can then fetch a read-only `products.json`.

## Cloudinary
Create a Cloudinary unsigned upload preset and enter its cloud name and preset in Admin > Image hosting. Do not expose your Cloudinary API secret. Unsigned uploads should be configured with appropriate restrictions in Cloudinary.

## WhatsApp checkout
Buy Now and cart checkout open WhatsApp with a prefilled message. The customer must press Send in WhatsApp. No online payment is taken.
