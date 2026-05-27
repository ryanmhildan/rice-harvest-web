import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengatur agar Next.js jalan di port 3001 sesuai design
  // (Port 3000 dipakai NodeODM, port 8000 FastAPI)
  // Note: ini juga bisa di-set via `npm run dev -- -p 3001`

  // Allow image dari backend localhost
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/files/**",
      },
    ],
  },
};

export default nextConfig;
