import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "lib",
  format: "cjs",
  platform: "node",
  target: "node22",
  fixedExtension: false,
  dts: true,
  clean: true,
  outputOptions: {
    comments: false,
    minify: {
      compress: false,
      mangle: false,
      codegen: {
        removeWhitespace: true,
      },
    },
  },
});
