/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force Turbopack to resolve the ESM build of R3F (no ReactCurrentOwner)
  turbopack: {
    resolveAlias: {
      "@react-three/fiber": "@react-three/fiber/dist/react-three-fiber.esm.js",
    },
  },
}

export default nextConfig
