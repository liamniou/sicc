/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.chai$/,
      use: "raw-loader",
    });
    return config;
  },
};

export default nextConfig;
