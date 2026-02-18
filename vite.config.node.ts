import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [dts()],
	build: {
		target: "esnext",
		lib: {
			entry: resolve(__dirname, "src/node.ts"),
			name: "ePubNode",
		},
		rollupOptions: {
			external: ["jszip", "linkedom"],
			output: [
				{
					format: "es",
					entryFileNames: "epub.node.js",
					exports: "named",
				},
				{
					format: "cjs",
					entryFileNames: "epub.node.cjs",
					exports: "named",
				},
			],
		},
		sourcemap: true,
		emptyOutDir: false,
	},
});
