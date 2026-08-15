import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config is right for this app: no KV/R2 usage, no ISR cache
// beyond what Next.js does in-memory. If image optimization or ISR
// caching is added later, this is where the Cloudflare-specific
// incremental cache / queue overrides get wired in.
export default defineCloudflareConfig();
