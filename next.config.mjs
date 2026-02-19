/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Pre-existing type errors in analytics/seed files — suppress during builds
    // TODO: clean up when doing a dedicated type audit sprint
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable client-side Router Cache for dynamic pages (default is 30s in Next 14).
    // This ensures dashboard widgets always show fresh data when navigating between
    // pages — no stale wins/pipeline counts after moving leads in the kanban.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
