import { describe, it, expect, vi, afterEach } from "vitest";
import Queue from "../src/utils/queue";
import { Task } from "../src/utils/queue";

// In jsdom, requestAnimationFrame exists and would cause run() to auto-process.
// We disable tick so enqueue() doesn't trigger async processing, then test
// dequeue/flush/dump manually.
function createTestQueue(ctx?: object): Queue {
	const q = new Queue(ctx);
	q.tick = false;
	return q;
}

describe("Queue", () => {
	describe("constructor", () => {
		it("should initialize with empty queue", () => {
			const q = createTestQueue();
			expect(q.length()).toBe(0);
		});

		it("should store context", () => {
			const ctx = { name: "test" };
			const q = createTestQueue(ctx);
			expect(q.context).toBe(ctx);
		});

		it("should not be running or paused", () => {
			const q = new Queue();
			expect(q.running).toBe(false);
			expect(q.paused).toBe(false);
		});
	});

	describe("enqueue()", () => {
		it("should throw when no task is provided", () => {
			const q = createTestQueue();
			expect(() => (q as any).enqueue()).toThrow("No Task Provided");
		});

		it("should accept a function task and return a promise", () => {
			const q = createTestQueue();
			const result = q.enqueue(() => 42);
			expect(result).toBeInstanceOf(Promise);
			expect(q.length()).toBe(1);
		});

		it("should accept a promise task", () => {
			const q = createTestQueue();
			const p = Promise.resolve("done");
			const result = q.enqueue(p);
			expect(result).toBe(p);
		});

		it("should pass extra args to the task function", async () => {
			const q = createTestQueue();
			const fn = vi.fn((...args: unknown[]) => args);
			q.enqueue(fn, "a", "b");
			await q.dequeue();
			expect(fn).toHaveBeenCalledWith("a", "b");
		});
	});

	describe("dequeue()", () => {
		it("should execute the next function task in queue", async () => {
			const q = createTestQueue();
			const fn = vi.fn(() => "result");
			q.enqueue(fn);
			await q.dequeue();
			expect(fn).toHaveBeenCalledOnce();
		});

		it("should resolve deferred with sync return value", async () => {
			const q = createTestQueue();
			const promise = q.enqueue(() => 99);
			q.dequeue();
			expect(await promise).toBe(99);
		});

		it("should resolve deferred with async return value", async () => {
			const q = createTestQueue();
			const promise = q.enqueue(async () => "async-val");
			await q.dequeue();
			expect(await promise).toBe("async-val");
		});

		it("should call task with queue context", async () => {
			const ctx = { value: 7 };
			const q = createTestQueue(ctx);
			let capturedThis: unknown;
			q.enqueue(function (this: unknown) { capturedThis = this; });
			await q.dequeue();
			expect(capturedThis).toBe(ctx);
		});

		it("should return resolved promise when queue is empty", async () => {
			const q = createTestQueue();
			const result = await q.dequeue();
			expect(result).toBeUndefined();
		});

		it("should not process when paused", async () => {
			const q = createTestQueue();
			q.pause();
			const fn = vi.fn();
			q._q.push({ task: fn, args: [], promise: Promise.resolve() });
			await q.dequeue();
			expect(fn).not.toHaveBeenCalled();
		});
	});

	describe("flush()", () => {
		it("should execute all queued tasks sequentially", async () => {
			const q = createTestQueue();
			const order: number[] = [];
			q.enqueue(() => { order.push(1); });
			q.enqueue(() => { order.push(2); });
			q.enqueue(() => { order.push(3); });
			// Reset running so flush doesn't early-return
			q.running = undefined;
			await q.flush();
			expect(order).toEqual([1, 2, 3]);
		});

		it("should handle async tasks", async () => {
			const q = createTestQueue();
			let value = 0;
			q.enqueue(async () => {
				await new Promise(r => setTimeout(r, 5));
				value = 42;
			});
			q.running = undefined;
			await q.flush();
			expect(value).toBe(42);
		});

		it("should return undefined when queue is empty", () => {
			const q = createTestQueue();
			expect(q.flush()).toBeUndefined();
		});

		it("should return existing running promise if already running", () => {
			const q = createTestQueue();
			const sentinel = Promise.resolve() as unknown as Promise<void>;
			q.running = sentinel;
			expect(q.flush()).toBe(sentinel);
		});
	});

	describe("clear()", () => {
		it("should remove all pending tasks", () => {
			const q = createTestQueue();
			q.enqueue(() => {});
			q.enqueue(() => {});
			q.clear();
			expect(q.length()).toBe(0);
		});
	});

	describe("length()", () => {
		it("should return the number of queued tasks", () => {
			const q = createTestQueue();
			q.enqueue(() => {});
			q.enqueue(() => {});
			expect(q.length()).toBe(2);
		});
	});

	describe("pause()", () => {
		it("should set paused to true", () => {
			const q = createTestQueue();
			q.pause();
			expect(q.paused).toBe(true);
		});
	});

	describe("stop()", () => {
		it("should clear queue, stop running, and set paused", () => {
			const q = createTestQueue();
			q.enqueue(() => {});
			q.stop();
			expect(q.length()).toBe(0);
			expect(q.running).toBe(false);
			expect(q.paused).toBe(true);
		});
	});

	describe("dump()", () => {
		it("should process all tasks immediately", () => {
			const q = createTestQueue();
			const order: number[] = [];
			q.enqueue(() => { order.push(1); });
			q.enqueue(() => { order.push(2); });
			q.dump();
			expect(order).toEqual([1, 2]);
			expect(q.length()).toBe(0);
		});
	});
});

describe("Task", () => {
	it("should wrap a callback-style function into a promise", async () => {
		const fn = function (_arg1: string, callback: (value: unknown, err: unknown) => void) {
			callback("result", null);
		};
		const wrapped = new Task(fn, []) as unknown as (...args: unknown[]) => Promise<unknown>;
		const result = await wrapped("hello");
		expect(result).toBe("result");
	});

	it("should reject when callback receives an error", async () => {
		const fn = function (callback: (value: unknown, err: unknown) => void) {
			callback(null, new Error("fail"));
		};
		const wrapped = new Task(fn, []) as unknown as (...args: unknown[]) => Promise<unknown>;
		await expect(wrapped()).rejects.toThrow("fail");
	});
});
