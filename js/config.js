/* Store configuration. Change these values for your store. */
window.STORE_CONFIG = {
  storeName: "Buxin Store",
  whatsappNumber: "2207741187", // International number with country code, digits only. Works from any country.
  currency: "GMD",
  currencyLocale: "en-GM",
  demoAdminPassword: "buxin1", // DEMO ONLY. Not secure for public production use.
  cloudinaryCloudName: "dfizb64hx",
  cloudinaryUploadPreset: "buxin_store",
  // Limited Neon role for supplier intake only (suppliers + supplier_products). Not the owner URL.
  neonIntakeUrl: "postgresql://buxin_intake:BuxinInlWAh7ye6WTlkga@ep-old-voice-bevlj3eh-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require",
  usdToInr: 88, // Supplier USD prices become the rupee amount already used in the catalogue.
  inrToGmd: 0.8003321, // 20 Nov 2026 mid-market rate: 1 Indian rupee = 0.8003321 Gambian dalasi.
  priceMarkup: 1
};