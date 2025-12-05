import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rule overrides
  {
    rules: {
      // Disable the overly strict setState-in-effect rule as it blocks
      // valid patterns for data fetching in useEffect
      "react-hooks/set-state-in-effect": "off",
      // Allow creating components during render for dynamic icon patterns
      "react-hooks/static-components": "off",
    },
  },
]);

export default eslintConfig;
