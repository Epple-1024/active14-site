import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel"; // 変更点1: インポートパスを短縮

export default defineConfig({
  output: "static", // 変更点2: "hybrid"廃止に伴い "static" へ変更
  //trailingSlash: "always", // 元の設定を維持
  integrations: [tailwind()], // 元の設定を維持
  adapter: vercel(),
});