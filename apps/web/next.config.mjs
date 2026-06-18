/** @type {import('next').NextConfig} */
const nextConfig = {
  // The board domain package ships TypeScript source (no build step); let Next compile it.
  transpilePackages: ["@task-board/board"],
};

export default nextConfig;
