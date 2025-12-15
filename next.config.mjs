/** @type {import('next').NextConfig} */
const isExport =
  process.env.NEXT_OUTPUT_EXPORT === '1' ||
  process.env.CAP_EXPORT === '1';

const nextConfig = {
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  ...(isExport ? { output: 'export' } : {}),
};

export default nextConfig;
