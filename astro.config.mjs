import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  integrations: [tailwind()],
  adapter: cloudflare({
    mode: "static"
  })
});
