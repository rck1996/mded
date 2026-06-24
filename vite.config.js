import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("jszip")) return "zip-export";
          if (id.includes("marked")) return "markdown-render";
          if (id.includes("@codemirror/search")) return "codemirror-search";
          if (id.includes("@codemirror/lang-markdown")) return "codemirror-markdown";
          if (id.includes("@codemirror/language")) return "codemirror-language";
          if (
            id.includes("@codemirror/view") ||
            id.includes("@codemirror/state") ||
            id.includes("@codemirror/commands") ||
            id.includes("/codemirror/")
          ) {
            return "codemirror-core";
          }

          return "vendor";
        },
      },
    },
  },
});
