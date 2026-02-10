import {defer, requestAnimationFrame} from "./core";


/**
 * Queue for handling tasks one at a time
 * @class
 * @param {scope} context what this will resolve to in the tasks
 */
class Queue {
	_q: any[];
	context: any;
	tick: any;
	running: any;
	paused: boolean;
	defered: any;

	constructor(context: any){
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
	enqueue(..._args: any[]): Promise<any> {
		let deferred, promise;
		let queued;
		const [task, ...args] = _args;

		// Handle single args without context
		// if(args && !Array.isArray(args)) {
		//   args = [args];
		// }
		if(!task) {
			throw new Error("No Task Provided");
		}

		if(typeof task === "function"){

			deferred = new defer();
			promise = deferred.promise;

			queued = {
				"task" : task,
				"args"     : args,
				//"context"  : context,
				"deferred" : deferred,
				"promise" : promise
			};

		} else {
			// Task is a promise
			queued = {
				"promise" : task
			};

		}

		this._q.push(queued);

		// Wait to start queue flush
		if (this.paused == false && !this.running) {
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
	dequeue(): any {
		let inwait: any, task, result;

		if(this._q.length && !this.paused) {
			inwait = this._q.shift();
			task = inwait.task;
			if(task){
				// console.log(task)

				result = task.call(this.context, ...inwait.args);

				if(result && typeof result["then"] === "function") {
					// Task is a function that returns a promise
					return result.then((...args: any[]) => {
						inwait.deferred.resolve(...args);
					}, (...args: any[]) => {
						inwait.deferred.reject(...args);
					});
				} else {
					// Task resolves immediately
					inwait.deferred.resolve(result);
					return inwait.promise;
				}



			} else if(inwait.promise) {
				// Task is a promise
				return inwait.promise;
			}

		} else {
			inwait = new defer();
			inwait.resolve();
			return inwait.promise;
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
	run(): Promise<any> {

		if(!this.running){
			this.running = true;
			this.defered = new defer();
		}

		this.tick(() => {

			if(this._q.length) {

				this.dequeue()
					.then(() => {
						this.run();
					});

			} else {
				this.defered.resolve();
				this.running = undefined;
			}

		});

		// Unpause
		if(this.paused == true) {
			this.paused = false;
		}

		return this.defered.promise;
	}

	/**
	 * Flush all, as quickly as possible
	 * @return {Promise}
	 */
	flush(): any {

		if(this.running){
			return this.running;
		}

		if(this._q.length) {
			this.running = this.dequeue()
				.then(() => {
					this.running = undefined;
					return this.flush();
				});

			return this.running;
		}

	}

	/**
	 * Clear all items in wait
	 */
	clear(): void {
		this._q = [];
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
		this._q = [];
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
	constructor(task: Function, args: any[], context: any){

		return function(this: unknown, ...toApply: any[]): Promise<any> {

			return new Promise( (resolve, reject) => {
				const callback = function(value: any, err: any): void {
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
