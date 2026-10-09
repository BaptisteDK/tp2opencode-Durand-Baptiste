import { defineConfig } from "vitest/config";

// Convention du depot : *.spec.ts et *.test.ts sont executes.
// Restreindre a *.spec.ts seul excluait bookings.test.ts et price.test.ts du filet.
export default defineConfig({
  test: {
    include: ["test/**/*.spec.ts", "test/**/*.test.ts"],
    environment: "node"
  }
});
