import { vi } from "vitest";
import type Section from "../src/section";
import type Layout from "../src/layout";

export function createMockSection(index: number = 0): Section {
	return {
		index,
		href: "chapter1.xhtml",
		cfiBase: "epubcfi(/6/2!)",
		canonical: "http://example.com/chapter1.xhtml",
		properties: [],
		render: vi.fn().mockResolvedValue("<html><body>test</body></html>"),
		next: vi.fn(),
		prev: vi.fn(),
	} as unknown as Section;
}

export function createMockLayout(): Layout {
	return {
		name: "reflowable",
		width: 800,
		height: 600,
		columnWidth: 400,
		pageWidth: 400,
		spreadWidth: 800,
		gap: 20,
		delta: 800,
		divisor: 2,
		format: vi.fn(),
		props: {
			name: "reflowable",
			spread: true,
			flow: "paginated",
			width: 800,
			height: 600,
			spreadWidth: 800,
			columnWidth: 400,
			gap: 20,
			divisor: 2,
			delta: 800,
			pageWidth: 400,
		},
	} as unknown as Layout;
}
