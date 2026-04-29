// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   output: "standalone",
// };

// export default nextConfig;



// const nextConfig = {
//   output: "standalone",
//   async rewrites() {
//     return [
//       {
//         source: "/backend/:path*",
//         destination: "http://backend.internal:5000/:path*",
//       },
//     ];
//   },
// };

// export default nextConfig;


const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://localhost:5000/:path*",
      },
    ];
  },
};

export default nextConfig;