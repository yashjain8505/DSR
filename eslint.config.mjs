import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off Node/tsx utilities (seeders, fixers). Run via node / npx tsx,
    // not part of the Next build — CommonJS require() and loose typing are fine.
    "scripts/**",
  ]),
  {
    // eslint-plugin-react-hooks v6 (React Compiler) promoted set-state-in-effect
    // to an error. The codebase uses intentional hydration / fetch-on-mount
    // effects that call setState; keep it visible as a warning rather than
    // failing the build && lint gate.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
