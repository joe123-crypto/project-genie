import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    // Disable unnecessary or noisy rules below
    rules: {
      // Allow use of <img> tags instead of forcing Next.js <Image>
      '@next/next/no-img-element': 'off',
      // Not needed in Next.js 12+
      'react/react-in-jsx-scope': 'off',
      // Allow use of 'any' type in TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      // Don't require explicit return types for module boundaries
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Allow console.log for debugging
      'no-console': 'off',
      // Allow unused variables (can be noisy during development)
      'no-unused-vars': 'off',
      // Allow unused expressions (e.g., short-circuit expressions)
      '@typescript-eslint/no-unused-expressions': 'off',
      // Allow aliasing 'this' to a local variable
      '@typescript-eslint/no-this-alias': 'off',
      // Allow empty object types and interfaces
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow @ts-ignore comments
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];

export default eslintConfig;
