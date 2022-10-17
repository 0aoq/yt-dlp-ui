import { defineConfig } from "vite";

export default defineConfig({
    root: "public",
    build: {
        rollupOptions: {
            external: [],
            output: { globals: {} },
        },
    },
});
