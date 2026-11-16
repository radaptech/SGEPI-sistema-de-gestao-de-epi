import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// o mesmo gate que o CRA fazia no build: regras do JS, JSX e dos hooks
export default [
  { ignores: ["build", "node_modules", "public/sw.js"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      // como no CRA: catch vazio e erro do catch sem uso são normais aqui (o api.js já avisa o usuário)
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["warn", { varsIgnorePattern: "^(_|React$)", argsIgnorePattern: "^_", caughtErrors: "none", ignoreRestSiblings: true }],
    },
  },
  { files: ["*.config.{js,cjs}"], languageOptions: { globals: globals.node } },
  { files: ["public/**/*.js"], languageOptions: { globals: globals.browser } },
];
