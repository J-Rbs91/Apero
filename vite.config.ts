import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  base: "/Apero/",
  test: {
    // Les tests du serveur (server/src/*.test.ts) tournent sous node:test via
    // `npm test` dans server/ — vitest ne doit pas les ramasser.
    exclude: [...configDefaults.exclude, "server/**"],
  },
});
