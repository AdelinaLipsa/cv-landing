// The site's own address. Vercel sets the production domain (custom one first); localhost otherwise.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const siteUrl = host ? `https://${host}` : "http://localhost:3000";
