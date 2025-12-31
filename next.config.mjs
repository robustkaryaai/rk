/** @type {import('next').NextConfig} */
const isExport =
  process.env.NEXT_OUTPUT_EXPORT === '1' ||
  process.env.CAP_EXPORT === '1';

const nextConfig = {
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // In production, replace * with your App URL if strictness is needed
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  ...(isExport ? { output: 'export' } : {}),
};

export default nextConfig;
