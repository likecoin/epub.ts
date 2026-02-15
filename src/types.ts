/**
 * Shared type definitions for epub.ts
 * Adapted from legacy types/ directory (epubjs v0.3.93)
 */
import type Section from "./section";

// ===== Deferred =====
export interface Deferred<T = any> {
	id: string;
	resolve: (value?: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
	promise: Promise<T>;
}

// ===== Event Emitter =====
export interface IEventEmitter {
	on(type: string, fn: (...args: any[]) => void): any;
	off(type: string, fn?: (...args: any[]) => void): any;
	emit(type: string, ...args: any[]): void;
	__listeners?: Record<string, Array<(...args: any[]) => void>>;
}

// ===== Packaging =====
export interface PackagingMetadataObject {
	title: string;
	creator: string;
	description: string;
	pubdate: string;
	publisher: string;
	identifier: string;
	language: string;
	rights: string;
	modified_date: string;
	layout: string;
	orientation: string;
	flow: string;
	viewport: string;
	media_active_class: string;
	spread: string;
	direction: string;
}

export interface PackagingSpineItem {
	id?: string;
	idref: string;
	linear: string;
	properties: string[];
	index: number;
}

export interface PackagingManifestItem {
	href: string;
	type: string;
	overlay: string;
	properties: string[];
	fallback: string;
}

export interface PackagingManifestObject {
	[key: string]: PackagingManifestItem;
}

export interface PackagingObject {
	metadata: PackagingMetadataObject;
	spine: PackagingSpineItem[];
	manifest: PackagingManifestObject;
	navPath: string;
	ncxPath: string;
	coverPath: string;
	spineNodeIndex: number;
}

// ===== Navigation =====
export interface NavItem {
	id: string;
	href: string;
	label: string;
	subitems?: NavItem[];
	parent?: string;
}

export interface LandmarkItem {
	href?: string;
	label?: string;
	type?: string;
}

// ===== Spine Item (data shape) =====
export interface SpineItem {
	index: number;
	cfiBase: string;
	idref: string;
	href: string;
	url: string;
	canonical: string;
	properties: string[];
	linear: string;
	id?: string;
	next: () => Section | undefined;
	prev: () => Section | undefined;
}

// ===== Page List =====
export interface PageListItem {
	href: string;
	page: number;
	cfi?: string;
	packageUrl?: string;
}

// ===== Book =====
export interface BookOptions {
	requestMethod?: RequestFunction;
	requestCredentials?: boolean;
	requestHeaders?: Record<string, string>;
	encoding?: string;
	replacements?: string;
	canonical?: (path: string) => string;
	openAs?: string;
	store?: string | boolean;
}

// ===== Rendition =====
export interface RenditionOptions {
	width?: number | string;
	height?: number | string;
	ignoreClass?: string;
	manager?: string | Function | object;
	view?: string | Function | object;
	flow?: string;
	layout?: string;
	spread?: string | boolean;
	minSpreadWidth?: number;
	stylesheet?: string;
	resizeOnOrientationChange?: boolean;
	script?: string;
	infinite?: boolean;
	overflow?: string;
	snap?: boolean | object;
	defaultDirection?: string;
	allowScriptedContent?: boolean;
	allowPopups?: boolean;
}

export interface DisplayedLocation {
	index: number;
	href: string;
	cfi: string;
	location?: number;
	percentage?: number;
	page?: number;
	displayed: {
		page: number;
		total: number;
	};
}

export interface Location {
	start: DisplayedLocation;
	end: DisplayedLocation;
	atStart?: boolean;
	atEnd?: boolean;
}

// ===== Layout =====
export interface LayoutSettings {
	layout?: string;
	spread?: string;
	minSpreadWidth?: number;
	evenSpreads?: boolean;
	flow?: string;
	direction?: string;
}

export interface LayoutProps {
	name: string;
	spread: boolean;
	flow: string;
	width: number;
	height: number;
	spreadWidth: number;
	pageWidth?: number;
	delta: number;
	columnWidth: number;
	gap: number;
	divisor: number;
}

// ===== Contents =====
export interface ViewportSettings {
	width: string;
	height: string;
	scale: string;
	scalable: string;
	minimum: string;
	maximum: string;
}

// ===== Mapping =====
export interface EpubCFIPair {
	start: string;
	end: string;
}

export interface RangePair {
	start: Range;
	end: Range;
}

// ===== EpubCFI =====
export interface EpubCFIStep {
	id: string | null;
	tagName: string;
	type: string;
	index: number;
}

export interface EpubCFIComponent {
	steps: EpubCFIStep[];
	terminal: {
		offset: number | null;
		assertion: string | null;
	};
}

// ===== Function Types =====
export type RequestFunction = (url: string, type?: string, withCredentials?: boolean, headers?: Record<string, string>) => Promise<any>;

// ===== Bounds/Sizing =====
export interface SizeObject { width: number; height: number; }
export interface ReframeBounds extends SizeObject { widthDelta: number; heightDelta: number; }

// ===== Themes =====
export interface ThemeEntry { rules?: Record<string, Record<string, string>>; url?: string; serialized?: string; injected?: boolean; }

// ===== View / Manager =====
export interface ViewSettings {
	ignoreClass?: string;
	axis?: string;
	direction?: string;
	flow?: string;
	layout?: LayoutProps;
	method?: string;
	width?: number;
	height?: number;
	forceEvenPages?: boolean;
	forceRight?: boolean;
	allowScriptedContent?: boolean;
	allowPopups?: boolean;
	globalLayoutProperties?: GlobalLayout;
}

export interface ViewLocation {
	index: number;
	href: string;
	pages: number[];
	totalPages: number;
	mapping: EpubCFIPair;
}

export interface ManagerOptions extends ViewSettings {
	infinite?: boolean;
	overflow?: string;
	hidden?: boolean;
	fullsize?: boolean;
	snap?: boolean | object;
	view?: string | Function | object;
	request?: RequestFunction;
	[key: string]: any;
}

// ===== Hooks =====
export interface HooksObject {
	[key: string]: any;
}

// ===== Stage =====
export interface StageOptions {
	width?: number | string;
	height?: number | string;
	overflow?: string | boolean;
	hidden?: boolean;
	axis?: string;
	fullsize?: boolean;
	direction?: string;
	dir?: string;
	writingMode?: string;
}

// ===== Global Layout =====
export interface GlobalLayout {
	layout: string;
	spread: string;
	orientation: string;
	flow: string;
	viewport: string;
	minSpreadWidth: number;
	direction: string;
}

// ===== Search Result =====
export interface SearchResult {
	cfi: string;
	excerpt: string;
}

// ===== Path =====
export interface ParsedPath {
	root: string;
	dir: string;
	base: string;
	ext: string;
	name: string;
}

// ===== Window Augmentation =====
declare global {
	interface Window {
		webkitURL?: typeof URL;
		mozURL?: typeof URL;
	}
}
