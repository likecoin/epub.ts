// Polyfill URL.createObjectURL / revokeObjectURL for jsdom
if (typeof URL.createObjectURL === "undefined") {
	let counter = 0;
	URL.createObjectURL = (_blob: Blob) => `blob:http://localhost/${++counter}`;
	URL.revokeObjectURL = (_url: string) => {};
}

// Polyfill ResizeObserver for jsdom
if (typeof ResizeObserver === "undefined") {
	(globalThis as any).ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
