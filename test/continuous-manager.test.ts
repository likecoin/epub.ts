import { describe, it, expect, vi, afterEach } from "vitest";
import ContinuousViewManager from "../src/managers/continuous/index";
import type { ManagerOptions, ViewSettings } from "../src/types";
import type Section from "../src/section";
import type Layout from "../src/layout";
import type IframeView from "../src/managers/views/iframe";
import Queue from "../src/utils/queue";

function createMockManagerOptions(overrides?: Partial<ManagerOptions["settings"]>): ManagerOptions {
	return {
		view: class MockView {
			element = document.createElement("div");
			section = { index: 0, next: vi.fn(), prev: vi.fn() } as unknown as Section;
			displayed = false;
			expanded = false;
			index = 0;
			settings = {} as ViewSettings;
			contents = null;
			show = vi.fn();
			hide = vi.fn();
			destroy = vi.fn();
			display = vi.fn().mockResolvedValue(this);
			on = vi.fn();
			off = vi.fn();
			emit = vi.fn();
			onDisplayed = vi.fn();
			onResize = vi.fn();
			setLayout = vi.fn();
			setAxis = vi.fn();
			offset = vi.fn().mockReturnValue({ top: 0, left: 0 });
			width = vi.fn().mockReturnValue(800);
			height = vi.fn().mockReturnValue(600);
			position = vi.fn().mockReturnValue({ left: 0, right: 800, top: 0, bottom: 600 });
			bounds = vi.fn().mockReturnValue({ width: 800, height: 600 });
			locationOf = vi.fn().mockReturnValue({ left: 0, top: 0 });
		} as unknown as ManagerOptions["view"],
		request: vi.fn().mockResolvedValue(""),
		queue: new Queue({}),
		settings: {
			axis: "horizontal",
			direction: "ltr",
			flow: "scrolled",
			ignoreClass: "",
			fullsize: false,
			allowScriptedContent: false,
			allowPopups: false,
			snap: false,
			...overrides,
		},
	} as ManagerOptions;
}

describe("ContinuousViewManager", () => {

	describe("constructor", () => {
		it("should set name to 'continuous'", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.name).toBe("continuous");
		});

		it("should set default offset to 500", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.settings.offset).toBe(500);
		});

		it("should set default afterScrolledTimeout to 10", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.settings.afterScrolledTimeout).toBe(10);
		});

		it("should handle gap=0", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions({ gap: 0 }));
			expect(manager.settings.gap).toBe(0);
		});

		it("should initialize scrollTop and scrollLeft to 0", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.scrollTop).toBe(0);
			expect(manager.scrollLeft).toBe(0);
		});

		it("should set forceEvenPages to false", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.viewSettings.forceEvenPages).toBe(false);
		});

		it("should pass method through to viewSettings", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions({ method: "blobUrl" }));
			expect(manager.viewSettings.method).toBe("blobUrl");
		});

		it("should leave method undefined when not configured", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.viewSettings.method).toBeUndefined();
		});
	});

	describe("updateFlow()", () => {
		it("should destroy snapper on flow change", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			// Simulate an existing snapper
			manager.snapper = { destroy: vi.fn() } as any;
			manager.updateFlow("scrolled");
			expect(manager.snapper).toBeUndefined();
		});

		it("should call super.updateFlow with 'scroll' default overflow", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.updateFlow("scrolled");
			expect(manager.overflow).toBe("scroll");
		});
	});

	describe("next()", () => {
		it("should return undefined when no views", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				height: 600,
			} as unknown as Layout;
			expect(manager.next()).toBeUndefined();
		});

		it("should scroll by delta horizontally when paginated horizontal", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = true;
			manager.settings.axis = "horizontal";
			// Add a mock view so views.length > 0
			const mockView = { element: document.createElement("div"), section: { next: vi.fn() }, destroy: vi.fn() };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.next();
			expect(spy).toHaveBeenCalledWith(800, 0, true);
			manager.destroy();
		});

		it("should scroll by layout.height vertically when not paginated horizontal", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = false;
			manager.settings.axis = "vertical";
			const mockView = { element: document.createElement("div"), section: { next: vi.fn() }, destroy: vi.fn() };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.next();
			expect(spy).toHaveBeenCalledWith(0, 600, true);
			manager.destroy();
		});
	});

	describe("prev()", () => {
		it("should return undefined when no views", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				height: 600,
			} as unknown as Layout;
			expect(manager.prev()).toBeUndefined();
		});

		it("should scroll by negative delta horizontally when paginated", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = true;
			manager.settings.axis = "horizontal";
			const mockView = { element: document.createElement("div"), section: { prev: vi.fn() }, destroy: vi.fn() };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.prev();
			expect(spy).toHaveBeenCalledWith(-800, 0, true);
			manager.destroy();
		});

		it("should scroll by negative layout.height vertically", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = false;
			manager.settings.axis = "vertical";
			const mockView = { element: document.createElement("div"), section: { prev: vi.fn() }, destroy: vi.fn() };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.prev();
			expect(spy).toHaveBeenCalledWith(0, -600, true);
			manager.destroy();
		});
	});

	describe("destroy()", () => {
		it("should call super.destroy()", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.destroy();
			expect(manager.rendered).toBe(false);
		});

		it("should destroy snapper if present", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			const destroySpy = vi.fn();
			manager.snapper = { destroy: destroySpy } as any;
			manager.destroy();
			expect(destroySpy).toHaveBeenCalled();
		});
	});

	describe("check()", () => {
		function managerWithFailingAppend(): {
			manager: ContinuousViewManager;
			failed: IframeView;
			nextSection: Section;
		} {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const nextSection = { index: 1 } as Section;
			manager.views.append({
				element: document.createElement("div"),
				section: { next: (): Section => nextSection, prev: (): undefined => undefined },
			} as unknown as IframeView);
			const failed = {
				element: document.createElement("div"),
				destroy: vi.fn(),
				display: vi.fn().mockRejectedValue(new Error("view failed")),
			} as unknown as IframeView;
			vi.spyOn(manager, "append").mockImplementation(() => {
				manager.views.append(failed);
				return Promise.resolve(failed);
			});
			return { manager, failed, nextSection };
		}

		// fill() loops while the result is truthy, so resolving with an Error
		// drove it down the whole spine.
		it("should resolve falsy and drop the view when it fails to display", async () => {
			const { manager, failed, nextSection } = managerWithFailingAppend();

			const onError = vi.fn();
			manager.on("displayerror", onError);

			await expect(manager.check()).resolves.toBe(false);

			// The default manager reports the same failure the same way; the
			// contract must not depend on which manager the reader configured.
			expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "view failed" }));

			// Without this the assertion above is ambiguous: check()'s other
			// branch resolves false too, without ever appending.
			expect(manager.append).toHaveBeenCalledWith(nextSection);
			expect(manager.views.all()).not.toContain(failed);
			expect(failed.destroy).toHaveBeenCalled();
		});

		// emit() runs listeners bare, so a throwing one would reject the very
		// promise this reporting exists to keep resolved — reintroducing the
		// rejection-into-nothing that check() swallows on purpose.
		it("should still resolve false when a displayerror listener throws", async () => {
			const { manager } = managerWithFailingAppend();
			manager.on("displayerror", () => { throw new Error("listener blew up"); });

			await expect(manager.check()).resolves.toBe(false);
		});
	});

	describe("update()", () => {
		function makeMockView(index: number): Record<string, unknown> {
			const el = document.createElement("div");
			el.style.width = "800px";
			el.style.height = "600px";
			return {
				index,
				displayed: true,
				displaying: false,
				expanded: false,
				element: el,
				section: { index, next: vi.fn(), prev: vi.fn() },
				show: vi.fn(),
				hide: vi.fn(),
				destroy: vi.fn().mockResolvedValue(undefined),
				display: vi.fn().mockImplementation(function(this: Record<string, unknown>) {
					return Promise.resolve(this);
				}),
				bounds: vi.fn().mockReturnValue({ width: 800, height: 600 }),
				offset: vi.fn().mockReturnValue({ top: 0, left: 0 }),
				position: vi.fn().mockReturnValue({ left: 0, right: 800, top: 0, bottom: 600 }),
				on: vi.fn(),
				off: vi.fn(),
				emit: vi.fn(),
			};
		}

		it("should destroy each off-screen view individually (regression: closure capture)", () => {
			// Regression for PR #14: `let view` outside the for-loop caused the
			// queued `() => view.destroy()` closures to all reference the last
			// iterated view, destroying the wrong view. Lock in that each
			// off-screen view's own destroy() is invoked.
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2, 3, 4].map(makeMockView);
			views.forEach(v => manager.views.append(v as any));

			// Only view 2 visible; ±1 neighbors (1, 3) are kept; 0 and 4 destroyed.
			vi.spyOn(manager, "isVisible").mockImplementation(
				(v: unknown) => (v as { index: number }).index === 2
			);

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			manager.update();
			manager.q.dump();

			expect((views[0]!.destroy as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
			expect((views[4]!.destroy as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
			expect((views[1]!.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
			expect((views[2]!.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
			expect((views[3]!.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
		});

		it("should destroy an off-screen view whose display is still in flight", () => {
			// The negative assertion matters: a view that is neither displayed
			// nor loading is already torn down, and re-destroying it every pass
			// would also re-arm the trim timeout.
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2, 3, 4].map(makeMockView);
			views[0]!.displayed = false;
			views[0]!.displaying = true;
			views[4]!.displayed = false;

			views.forEach(v => manager.views.append(v as any));
			vi.spyOn(manager, "isVisible").mockImplementation(
				(v: unknown) => (v as { index: number }).index === 2
			);

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			manager.update();
			manager.q.dump();

			expect((views[0]!.destroy as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
			expect((views[4]!.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
		});

		it("should report on displayerror when a scrolled-in view fails to display", async () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2].map(makeMockView);
			const failure = new Error("boom");
			views[1]!.displayed = false;
			views[1]!.display = vi.fn().mockRejectedValue(failure);
			views.forEach(v => manager.views.append(v as any));

			vi.spyOn(manager, "isVisible").mockImplementation(
				(v: unknown) => (v as { index: number }).index === 1
			);

			const reported: Error[] = [];
			manager.on("displayerror", (err: Error) => reported.push(err));

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			await manager.update();

			expect(reported).toEqual([failure]);
			expect((views[1]!.show as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
		});

		// display() leaves `displayed` false on failure, so a view left in place
		// is picked up again by every later pass — re-requesting the section and
		// re-emitting displayerror for as long as it stays on screen.
		it("should drop a failed view rather than retrying it on every pass", async () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2].map(makeMockView);
			views[1]!.displayed = false;
			views[1]!.display = vi.fn().mockRejectedValue(new Error("boom"));
			views.forEach(v => manager.views.append(v as any));

			vi.spyOn(manager, "isVisible").mockImplementation(
				(v: unknown) => (v as { index: number }).index === 1
			);

			const reported: Error[] = [];
			manager.on("displayerror", (err: Error) => reported.push(err));

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			await manager.update();
			await manager.update();
			await manager.update();

			expect(reported).toHaveLength(1);
			expect((views[1]!.display as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
			expect(manager.views.all()).not.toContain(views[1] as any);
		});

		it("should not report an aborted display, which update() itself causes", async () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2].map(makeMockView);
			views[1]!.displayed = false;
			views[1]!.display = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
			views.forEach(v => manager.views.append(v as any));

			vi.spyOn(manager, "isVisible").mockImplementation(
				(v: unknown) => (v as { index: number }).index === 1
			);

			const reported: Error[] = [];
			manager.on("displayerror", (err: Error) => reported.push(err));

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			await manager.update();

			expect(reported).toEqual([]);
		});

		it("should hide (not destroy) views in the ±1 keep buffer", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2].map(makeMockView);
			views.forEach(v => manager.views.append(v as any));

			vi.spyOn(manager, "isVisible").mockImplementation(
				(v: unknown) => (v as { index: number }).index === 1
			);

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			manager.update();
			manager.q.dump();

			expect((views[0]!.hide as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
			expect((views[2]!.hide as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
			expect((views[0]!.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
			expect((views[2]!.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
			expect((views[1]!.show as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
		});

		it("should skip destroying off-screen views while filling", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;

			const views = [0, 1, 2, 3].map(makeMockView);
			views.forEach(v => manager.views.append(v as any));

			vi.spyOn(manager, "isVisible").mockReturnValue(false);
			(manager as unknown as { _filling: boolean })._filling = true;

			manager.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			manager.update();
			manager.q.dump();

			for (const v of views) {
				expect((v.destroy as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
			}
		});
	});

	describe("trim()", () => {
		function makeDisplayedView(index: number, hasPrev: boolean, hasNext: boolean): Record<string, unknown> {
			return {
				index,
				displayed: true,
				element: document.createElement("div"),
				section: {
					index,
					next: vi.fn().mockReturnValue(hasNext ? {} : undefined),
					prev: vi.fn().mockReturnValue(hasPrev ? {} : undefined),
				},
				bounds: vi.fn().mockReturnValue({ width: 800, height: 600 }),
				destroy: vi.fn().mockResolvedValue(undefined),
			};
		}

		it("keeps an extra above-view when loaded window is at book end", async () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });

			// 4 above + 1 displayed, last view has no next (book end)
			const above = [
				makeDisplayedView(0, false, true),
				makeDisplayedView(1, true, true),
				makeDisplayedView(2, true, true),
				makeDisplayedView(3, true, true),
			];
			const displayedView = makeDisplayedView(4, true, false);
			[...above, displayedView].forEach(v => manager.views.append(v as any));

			// Mark above views as not-displayed so views.displayed() only returns index 4
			above.forEach(v => { v.displayed = false; });

			const eraseSpy = vi.spyOn(manager, "erase").mockImplementation(() => {});
			await manager.trim();

			// keepAbove = 2 at book end → erase above[0], above[1], leaving above[2], above[3]
			expect(eraseSpy).toHaveBeenCalledTimes(2);
			expect(eraseSpy).toHaveBeenCalledWith(above[0], expect.anything());
			expect(eraseSpy).toHaveBeenCalledWith(above[1], expect.anything());
		});

		it("keeps an extra below-view when loaded window is at book start", async () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });

			// 1 displayed + 4 below, first view has no prev (book start)
			const displayedView = makeDisplayedView(0, false, true);
			const below = [
				makeDisplayedView(1, true, true),
				makeDisplayedView(2, true, true),
				makeDisplayedView(3, true, true),
				makeDisplayedView(4, true, true),
			];
			[displayedView, ...below].forEach(v => manager.views.append(v as any));

			// Only index 0 displayed
			below.forEach(v => { v.displayed = false; });

			const eraseSpy = vi.spyOn(manager, "erase").mockImplementation(() => {});
			await manager.trim();

			// keepBelow = 2 at book start → erase below[2], below[3], keeping below[0], below[1]
			expect(eraseSpy).toHaveBeenCalledTimes(2);
			expect(eraseSpy).toHaveBeenCalledWith(below[2]);
			expect(eraseSpy).toHaveBeenCalledWith(below[3]);
		});
	});

	describe("erase()", () => {
		// Verifies the scroll-compensation arithmetic in erase() — when an
		// above-view is removed we shift the scroll position so the currently
		// visible content stays put. This is the actual jitter-risk surface.

		function makeView(width: number, height: number): Record<string, unknown> {
			return {
				displayed: true,
				element: document.createElement("div"),
				bounds: vi.fn().mockReturnValue({ width, height }),
				destroy: vi.fn(),
			};
		}

		function setContainerScroll(manager: ContinuousViewManager, top: number, left: number): void {
			Object.defineProperty(manager.container, "scrollTop", { value: top, configurable: true, writable: true });
			Object.defineProperty(manager.container, "scrollLeft", { value: left, configurable: true, writable: true });
		}

		function setWindowScroll(top: number, left: number): void {
			Object.defineProperty(window, "scrollY", { value: top, configurable: true, writable: true });
			Object.defineProperty(window, "scrollX", { value: left, configurable: true, writable: true });
		}

		function setupManager(overrides: {
			axis?: "horizontal" | "vertical";
			direction?: "ltr" | "rtl";
			fullsize?: boolean;
		}): ContinuousViewManager {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			if (overrides.axis !== undefined) manager.settings.axis = overrides.axis;
			if (overrides.direction !== undefined) manager.settings.direction = overrides.direction;
			if (overrides.fullsize !== undefined) manager.settings.fullsize = overrides.fullsize;
			managers.push(manager);
			return manager;
		}

		const managers: ContinuousViewManager[] = [];
		afterEach(() => {
			while (managers.length) managers.pop()!.destroy();
			// Window scroll can be mutated by fullsize tests — always reset.
			setWindowScroll(0, 0);
		});

		it("does not adjust scroll when called without an above array", () => {
			const manager = setupManager({ axis: "vertical" });
			setContainerScroll(manager, 1500, 0);

			const view = makeView(800, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any);

			expect(scrollSpy).not.toHaveBeenCalled();
		});

		it("vertical: shifts scrollTop up by the erased view's height", () => {
			const manager = setupManager({ axis: "vertical" });
			setContainerScroll(manager, 1500, 0);

			const view = makeView(800, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any, []);

			expect(scrollSpy).toHaveBeenCalledWith(0, 900, true);
		});

		it("horizontal LTR non-fullsize: shifts scrollLeft left by floor(width)", () => {
			const manager = setupManager({ axis: "horizontal", direction: "ltr", fullsize: false });
			setContainerScroll(manager, 0, 2400);

			const view = makeView(800, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any, []);

			expect(scrollSpy).toHaveBeenCalledWith(1600, 0, true);
		});

		it("horizontal LTR: applies Math.floor to fractional bounds.width", () => {
			const manager = setupManager({ axis: "horizontal", direction: "ltr", fullsize: false });
			setContainerScroll(manager, 0, 2400);

			const view = makeView(799.7, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any, []);

			// floor(799.7) = 799 → 2400 - 799 = 1601
			expect(scrollSpy).toHaveBeenCalledWith(1601, 0, true);
		});

		it("horizontal RTL non-fullsize: preserves scrollLeft (container compensates natively)", () => {
			const manager = setupManager({ axis: "horizontal", direction: "rtl", fullsize: false });
			setContainerScroll(manager, 0, -1600);

			const view = makeView(800, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any, []);

			expect(scrollSpy).toHaveBeenCalledWith(-1600, 0, true);
		});

		it("horizontal RTL fullsize: shifts scrollX right by floor(width) using window scroll", () => {
			setWindowScroll(0, -1600);
			const manager = setupManager({ axis: "horizontal", direction: "rtl", fullsize: true });

			const view = makeView(800, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any, []);

			expect(scrollSpy).toHaveBeenCalledWith(-800, 0, true);
		});

		it("vertical fullsize: reads window.scrollY for prevTop", () => {
			setWindowScroll(2000, 0);
			const manager = setupManager({ axis: "vertical", fullsize: true });

			const view = makeView(800, 600);
			manager.views.append(view as any);
			const scrollSpy = vi.spyOn(manager, "scrollTo").mockImplementation(() => {});

			manager.erase(view as any, []);

			expect(scrollSpy).toHaveBeenCalledWith(0, 1400, true);
		});

		it("removes the view from the views collection", () => {
			const manager = setupManager({ axis: "vertical" });
			setContainerScroll(manager, 600, 0);

			const view = makeView(800, 600);
			manager.views.append(view as any);
			expect(manager.views.length).toBe(1);

			vi.spyOn(manager, "scrollTo").mockImplementation(() => {});
			manager.erase(view as any, []);

			expect(manager.views.length).toBe(0);
		});
	});

	describe("pagehide handler", () => {
		it("should set ignore and call destroy() on pagehide when persisted is false", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			const spy = vi.spyOn(manager, "destroy");
			manager._onPageHide!({ persisted: false } as PageTransitionEvent);
			expect(manager.ignore).toBe(true);
			expect(spy).toHaveBeenCalled();
		});

		it("should skip destroy() and leave ignore untouched on pagehide when persisted is true (bfcache)", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			const ignoreBefore = manager.ignore;
			const spy = vi.spyOn(manager, "destroy");
			manager._onPageHide!({ persisted: true } as PageTransitionEvent);
			expect(spy).not.toHaveBeenCalled();
			expect(manager.ignore).toBe(ignoreBefore);
			manager.destroy();
		});
	});
});
