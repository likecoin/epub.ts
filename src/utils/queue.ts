import {defer, requestAnimationFrame} from "./core";

interface QueueItem {
	task?: (...args: unknown[]) => unknown;
	args: unknown[];
	deferred?: defer<unknown>;
	promise: Promise<unknown>;
}

/**
 * Queue for handling tasks one at a time
 * @class
 * @param {scope} context what this will resolve to in the tasks
 */
class Queue {
	_q: QueueItem[];
	context: object | undefined;
	tick: (cb: FrameRequestCallback) => number;
	running: boolean | Promise<void> | undefined;
	paused: boolean;
	defered: defer<void> | undefined;

	constructor(context?: object){
		this._q = [];
		this.context = context;
		this.tick = requestAnimationFrame;
		this.running = false;
		this.paused = false;
	}

	/**
	 * Add an item to the queue
	 * @return {Promise}
	 */
	enqueue<R>(promise: Promise<R>): Promise<R>;
	enqueue<A extends unknown[], R>(task: (...args: A) => R, ...args: A): Promise<Awaited<R>>;
	enqueue(..._args: unknown[]): Promise<unknown> {
		let deferred, promise;
		let queued: QueueItem;
		const [task, ...args] = _args;

		// Handle single args without context
		// if(args && !Array.isArray(args)) {
		//   args = [args];
		// }
		if(!task) {
			throw new Error("No Task Provided");
		}

		if(typeof task === "function"){

			deferred = new defer<unknown>();
			promise = deferred.promise;

			queued = {
				"task" : task as (...args: unknown[]) => unknown,
				"args"     : args,
				//"context"  : context,
				"deferred" : deferred,
				"promise" : promise
			};

		} else {
			// Task is a promise
			queued = {
				"args": [],
				"promise" : task as Promise<unknown>
			};

		}

		this._q.push(queued);

		// Wait to start queue flush
		if (!this.paused && !this.running) {
			// setTimeout(this.flush.bind(this), 0);
			// this.tick.call(window, this.run.bind(this));
			this.run();
		}

		return queued.promise;
	}

	/**
	 * Run one item
	 * @return {Promise}
	 */
	dequeue(): Promise<unknown> | undefined {
		let inwait: QueueItem, task, result;

		if(this._q.length && !this.paused) {
			inwait = this._q.shift()!;
			task = inwait.task;
			if(task){
				// console.log(task)

				result = task.call(this.context, ...inwait.args);

				if(result && typeof (result as Promise<unknown>)["then"] === "function") {
					// Task is a function that returns a promise
					return (result as Promise<unknown>).then((value: unknown) => {
						inwait.deferred!.resolve(value);
					}, (reason: unknown) => {
						inwait.deferred!.reject(reason);
					});
				} else {
					// Task resolves immediately
					inwait.deferred!.resolve(result);
					return inwait.promise;
				}

			} else {
				// Task is a promise
				return inwait.promise;
			}

		} else {
			return Promise.resolve();
		}

	}

	// Run All Immediately
	dump(): void {
		while(this._q.length) {
			this.dequeue();
		}
	}

	/**
	 * Run all tasks sequentially, at convince
	 * @return {Promise}
	 */
	run(): Promise<void> {

		// `!this.defered` matters as much as `!this.running`: clear() settles and
		// drops the deferred while a task is still in flight, leaving running set.
		// Without this, the next run() would hand back the settled promise and
		// report a drained queue that still has work in it.
		if(!this.running || !this.defered){
			this.running = true;
			this.defered = new defer<void>();
		}

		const step = (): void => {
			if(this._q.length) {

				this.dequeue()
					?.then(() => {
						this.run();
					});

			} else {
				this.defered?.resolve();
				this.running = undefined;
			}
		};

		this.tick(step);

		// Unpause
		if(this.paused) {
			this.paused = false;
		}

		return this.defered!.promise;
	}

	/**
	 * Flush all, as quickly as possible
	 * @return {Promise}
	 */
	flush(): Promise<void> | undefined {

		if(this.running){
			return this.running as Promise<void>;
		}

		if(this._q.length) {
			this.running = this.dequeue()
				?.then(() => {
					this.running = undefined;
					return this.flush();
				}) as Promise<void>;

			return this.running as Promise<void>;
		}

		return undefined;
	}

	/**
	 * Clear all items in wait
	 */
	clear(): void {
		const cleared = this._q;
		this._q = [];

		// Settle what never ran, or its promise hangs its awaiters forever.
		// Cancelling resolves undefined, as a superseded display does.
		for (const item of cleared) {
			item.deferred?.resolve(undefined);
		}

		// run()'s own promise is settled only by step() finding the queue empty,
		// which never happens when a task is still in flight. Left alone it hangs
		// whoever awaited run() — Locations.generate() does. Dropped as well as
		// settled, so a later run() mints a fresh one instead of returning this
		// already-resolved promise for work that hasn't started.
		this.defered?.resolve();
		this.defered = undefined;
	}

	/**
	 * Get the number of tasks in the queue
	 * @return {number} tasks
	 */
	length(): number {
		return this._q.length;
	}

	/**
	 * Pause a running queue
	 */
	pause(): void {
		this.paused = true;
	}

	/**
	 * End the queue
	 */
	stop(): void {
		this.clear();
		this.running = false;
		this.paused = true;
	}
}


/**
 * Create a new task from a callback
 * @class
 * @private
 * @param {function} task
 * @param {array} args
 * @param {scope} context
 * @return {function} task
 */
class Task {
	constructor(task: (...args: unknown[]) => void, args: unknown[], context?: object){

		return function(this: unknown, ...toApply: unknown[]): Promise<unknown> {

			return new Promise( (resolve, reject) => {
				const callback = function(value: unknown, err: unknown): void {
					if (!value && err) {
						reject(err);
					} else {
						resolve(value);
					}
				};
				// Add the callback to the arguments list
				toApply.push(callback);

				// Apply all arguments to the functions
				task.call(context || this, ...toApply);

			});

		};

	}
}


export default Queue;
export { Task };
