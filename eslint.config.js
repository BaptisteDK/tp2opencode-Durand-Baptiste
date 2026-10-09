import tseslint from "typescript-eslint";

// Regles choisies avec l'equipe (suite du ticket INFRA-212) : le jeu recommande
// typescript-eslint, sans point-virgule superflu. Le filet est volontairement
// strict : un `rules: {}` vide laissait passer concat string+number et @ts-nocheck.
export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-unused-vars": "off"
    }
  }
);
