import { describe, it, expect, vi } from "vitest";
import Hook from "../src/utils/hook";

describe("Hook", () => {
	describe("constructor", () => {
		it("should initialize with empty hooks array", () => {
			const hook = new Hook();
			expect(hook.hooks).toEqual([]);
		});

		it("should use provided context", () => {
			const ctx = { name: "test" };
			const hook = new Hook(ctx);
			expect(hook.context).toBe(ctx);
		});

		it("should default context to this", () => {
			const hook = new Hook();
			expect(hook.context).toBe(hook);
		});
	});

	describe("register()", () => {
		it("should add a single function", () => {
			const hook = new Hook();
			const fn = vi.fn();
			hook.register(fn);
			expect(hook.hooks.length).toBe(1);
			expect(hook.hooks[0]).toBe(fn);
		});

		it("should add multiple functions", () => {
			const hook = new Hook();
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			hook.register(fn1, fn2);
			expect(hook.hooks.length).toBe(2);
		});

		it("should unpack an array of functions", () => {
			const hook = new Hook();
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			hook.register([fn1, fn2]);
			expect(hook.hooks.length).toBe(2);
			expect(hook.hooks[0]).toBe(fn1);
			expect(hook.hooks[1]).toBe(fn2);
		});
	});

	describe("deregister()", () => {
		it("should remove a registered function", () => {
			const hook = new Hook();
			const fn = vi.fn();
			hook.register(fn);
			hook.deregister(fn);
			expect(hook.hooks.length).toBe(0);
		});

		it("should only remove the first occurrence", () => {
			const hook = new Hook();
			const fn = vi.fn();
			hook.register(fn, fn);
			hook.deregister(fn);
			expect(hook.hooks.length).toBe(1);
		});

		it("should no-op for unregistered function", () => {
			const hook = new Hook();
			const fn = vi.fn();
			expect(() => hook.deregister(fn)).not.toThrow();
			expect(hook.hooks.length).toBe(0);
		});
	});

	describe("trigger()", () => {
		it("should call all registered functions with args", async () => {
			const hook = new Hook();
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			hook.register(fn1, fn2);
			await hook.trigger("a", "b");
			expect(fn1).toHaveBeenCalledWith("a", "b");
			expect(fn2).toHaveBeenCalledWith("a", "b");
		});

		it("should call functions with the hook context", async () => {
			const ctx = { value: 42 };
			const hook = new Hook(ctx);
			let capturedThis: unknown;
			hook.register(function (this: unknown) { capturedThis = this; });
			await hook.trigger();
			expect(capturedThis).toBe(ctx);
		});

		it("should wait for async hooks to complete", async () => {
			const hook = new Hook();
			let resolved = false;
			hook.register(async () => {
				await new Promise(r => setTimeout(r, 10));
				resolved = true;
			});
			await hook.trigger();
			expect(resolved).toBe(true);
		});

		it("should handle sync hooks that return non-promise", async () => {
			const hook = new Hook();
			hook.register(() => { return; });
			const result = await hook.trigger();
			expect(result).toEqual([]);
		});

		it("should catch and log errors from hooks without rejecting", async () => {
			const hook = new Hook();
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			hook.register(() => { throw new Error("boom"); });
			await hook.trigger();
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should return results from all async hooks", async () => {
			const hook = new Hook();
			hook.register(async () => { return "a"; });
			hook.register(async () => { return "b"; });
			const result = await hook.trigger();
			expect(result).toEqual(["a", "b"]);
		});
	});

	describe("list()", () => {
		it("should return the hooks array", () => {
			const hook = new Hook();
			const fn = vi.fn();
			hook.register(fn);
			expect(hook.list()).toEqual([fn]);
		});
	});

	describe("clear()", () => {
		it("should empty the hooks array", () => {
			const hook = new Hook();
			hook.register(vi.fn(), vi.fn());
			hook.clear();
			expect(hook.hooks).toEqual([]);
		});

		it("should return the new empty array", () => {
			const hook = new Hook();
			hook.register(vi.fn());
			const result = hook.clear();
			expect(result).toEqual([]);
		});
	});
});
