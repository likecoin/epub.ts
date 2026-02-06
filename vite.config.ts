import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [dts()],
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "ePub",
		},
		rollupOptions: {
			external: ["jszip"],
			output: [
				{
					format: "es",
					entryFileNames: "epub.js",
					exports: "named",
				},
				{
					format: "cjs",
					entryFileNames: "epub.cjs",
					exports: "named",
				},
				{
					format: "umd",
					entryFileNames: "epub.umd.js",
					name: "ePub",
					exports: "named",
					globals: { jszip: "JSZip" },
					// Patch UMD global so window.ePub is the default export directly,
					// matching the original epubjs behavior: ePub(url) instead of ePub.default(url)
					footer: "typeof globalThis!=='undefined'&&globalThis.ePub&&globalThis.ePub.default&&(globalThis.ePub=Object.assign(globalThis.ePub.default,globalThis.ePub));",
				},
			],
		},
		sourcemap: true,
	},
});
