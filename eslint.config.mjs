import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts", "public/**", "tools/**"],
  },
  {
    rules: {
      // Every internal link is a plain <a> by design: full static pages.
      "@next/next/no-html-link-for-pages": "off",
      // Images are served as-is from /media (static export, no optimiser).
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
