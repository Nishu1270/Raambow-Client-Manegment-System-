/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self' ws: wss: http://localhost:* ws://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
} else {
  // Clear any cached HSTS on localhost during development
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=0",
  });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Prevents X-Powered-By: Next.js fingerprinting
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
