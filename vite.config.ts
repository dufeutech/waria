import { defineConfig } from "vite";
import type { MinifyOptions } from "terser";

const globalName = "waria";

const terserOptions: MinifyOptions = {
  compress: {
    passes: 4,
    pure_funcs: ["console.log"],
    drop_debugger: true,
    drop_console: false,
    unsafe: true,
    unsafe_arrows: true,
    unsafe_methods: true,
    unsafe_proto: true,
    unsafe_regexp: true,
    unsafe_undefined: true,
    inline: 3,
    collapse_vars: true,
    reduce_vars: true,
    reduce_funcs: true,
    dead_code: true,
    booleans_as_integers: true,
    hoist_funs: true,
    hoist_vars: false,
    join_vars: true,
    sequences: true,
    if_return: true,
    conditionals: true,
    comparisons: true,
    evaluate: true,
    toplevel: false, // Must be false for IIFE global assignment to work
    pure_getters: true,
  },
  mangle: {
    toplevel: false, // Must be false for IIFE global name to be preserved
    properties: {
      regex: /^_/,
    },
  },
  format: {
    comments: false,
    ecma: 2020,
  },
  ecma: 2020,
};

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "waria",
      fileName: (format) => `waria.${format}.js`,
      formats: ["es", "iife"],
    },
    minify: "terser",
    terserOptions,
    target: "es2022",
    rollupOptions: {
      // Bundle all dependencies (including nanostores) for both formats
      external: [],
      treeshake: {
        moduleSideEffects: true, // Components have side effects (they register themselves)
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: [
        {
          format: "es",
          entryFileNames: "index.js",
          assetFileNames: "index[extname]",
        },
        {
          format: "iife",
          name: globalName,
          entryFileNames: `${globalName}.iife.js`,
          assetFileNames: "index[extname]",
        },
      ],
    },
  },
  server: {
    open: true,
  },
});
