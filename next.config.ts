import type { NextConfig } from "next";

// Suppress specific Node.js deprecation warnings (e.g. DEP0169 from next-auth url.parse)
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
  if (
    (typeof warning === 'string' && warning.includes('DEP0169')) ||
    (warning && typeof warning === 'object' && (warning as any).code === 'DEP0169')
  ) {
    return;
  }
  return originalEmitWarning.apply(process, [warning, ...args] as any);
};

const nextConfig: NextConfig = {
  compress: true, // Enable gzip compression for API responses and static assets
};

export default nextConfig;
