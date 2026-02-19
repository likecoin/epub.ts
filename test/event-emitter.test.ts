import { describe, it, expect, vi } from "vitest";
import EventEmitter from "../src/utils/event-emitter";

interface Emittable {
	on(type: string, fn: (...args: any[]) => void): unknown;
	off(type: string, fn?: (...args: any[]) => void): unknown;
	emit(type: string, ...args: unknown[]): void;
}

function createEmitter(): Emittable {
	const obj = {} as Emittable;
	EventEmitter(obj);
	return obj;
}

describe("EventEmitter", () => {
	describe("mixin application", () => {
		it("should add on, off, emit methods to object", () => {
			const obj = createEmitter();
			expect(typeof obj.on).toBe("function");
			expect(typeof obj.off).toBe("function");
			expect(typeof obj.emit).toBe("function");
		});

		it("should add methods to prototype when given a function", () => {
			function MyClass(this: Emittable) {}
			EventEmitter(MyClass);
			expect(typeof MyClass.prototype.on).toBe("function");
			expect(typeof MyClass.prototype.off).toBe("function");
			expect(typeof MyClass.prototype.emit).toBe("function");
		});
	});

	describe("on()", () => {
		it("should register a listener", () => {
			const emitter = createEmitter();
			const fn = vi.fn();
			emitter.on("test", fn);
			emitter.emit("test");
			expect(fn).toHaveBeenCalledOnce();
		});

		it("should register multiple listeners for same event", () => {
			const emitter = createEmitter();
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			emitter.on("test", fn1);
			emitter.on("test", fn2);
			emitter.emit("test");
			expect(fn1).toHaveBeenCalledOnce();
			expect(fn2).toHaveBeenCalledOnce();
		});

		it("should return this for chaining", () => {
			const emitter = createEmitter();
			const result = emitter.on("test", () => {});
			expect(result).toBe(emitter);
		});
	});

	describe("emit()", () => {
		it("should pass arguments to listeners", () => {
			const emitter = createEmitter();
			const fn = vi.fn();
			emitter.on("data", fn);
			emitter.emit("data", "a", 42);
			expect(fn).toHaveBeenCalledWith("a", 42);
		});

		it("should not throw when emitting with no listeners", () => {
			const emitter = createEmitter();
			expect(() => emitter.emit("nonexistent")).not.toThrow();
		});

		it("should not affect other event types", () => {
			const emitter = createEmitter();
			const fn = vi.fn();
			emitter.on("a", fn);
			emitter.emit("b");
			expect(fn).not.toHaveBeenCalled();
		});

		it("should handle listener added during emit", () => {
			const emitter = createEmitter();
			const fn2 = vi.fn();
			emitter.on("test", () => {
				emitter.on("test", fn2);
			});
			emitter.emit("test");
			// fn2 should NOT be called during this emit (snapshot of listeners)
			expect(fn2).not.toHaveBeenCalled();
		});
	});

	describe("off()", () => {
		it("should remove a specific listener", () => {
			const emitter = createEmitter();
			const fn = vi.fn();
			emitter.on("test", fn);
			emitter.off("test", fn);
			emitter.emit("test");
			expect(fn).not.toHaveBeenCalled();
		});

		it("should remove all listeners for a type when no fn specified", () => {
			const emitter = createEmitter();
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			emitter.on("test", fn1);
			emitter.on("test", fn2);
			emitter.off("test");
			emitter.emit("test");
			expect(fn1).not.toHaveBeenCalled();
			expect(fn2).not.toHaveBeenCalled();
		});

		it("should return this for chaining", () => {
			const emitter = createEmitter();
			const result = emitter.off("test");
			expect(result).toBe(emitter);
		});

		it("should not throw when removing from nonexistent event", () => {
			const emitter = createEmitter();
			expect(() => emitter.off("nonexistent", vi.fn())).not.toThrow();
		});

		it("should only remove the matching listener, leaving others", () => {
			const emitter = createEmitter();
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			emitter.on("test", fn1);
			emitter.on("test", fn2);
			emitter.off("test", fn1);
			emitter.emit("test");
			expect(fn1).not.toHaveBeenCalled();
			expect(fn2).toHaveBeenCalledOnce();
		});
	});
});
