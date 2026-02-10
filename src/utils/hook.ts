/**
 * Hooks allow for injecting functions that must all complete in order before finishing
 * They will execute in parallel but all must finish before continuing
 * Functions may return a promise if they are async.
 * @param {any} context scope of this
 * @example this.content = new EPUBJS.Hook(this);
 */
class Hook {
	context: any;
	hooks: Function[];

	constructor(context?: any){
		this.context = context || this;
		this.hooks = [];
	}

	/**
	 * Adds a function to be run before a hook completes
	 * @example this.content.register(function(){...});
	 */
	register(...args: any[]): void {
		for(let i = 0; i < args.length; ++i) {
			if (typeof args[i] === "function") {
				this.hooks.push(args[i]);
			} else {
				// unpack array
				for(let j = 0; j < args[i].length; ++j) {
					this.hooks.push(args[i][j]);
				}
			}
		}
	}

	/**
	 * Removes a function
	 * @example this.content.deregister(function(){...});
	 */
	deregister(func: Function): void {
		let hook;
		for (let i = 0; i < this.hooks.length; i++) {
			hook = this.hooks[i];
			if (hook === func) {
				this.hooks.splice(i, 1);
				break;
			}
		}
	}

	/**
	 * Triggers a hook to run all functions
	 * @example this.content.trigger(args).then(function(){...});
	 */
	trigger(...args: any[]): Promise<any[]> {
		const context = this.context;
		const promises: any[] = [];

		this.hooks.forEach(function(task) {
			let executing;
			try {
				executing = task.call(context, ...args);
			} catch (_err) {
				// eslint-disable-next-line no-console
				console.log(_err);
			}

			if(executing && typeof executing["then"] === "function") {
				// Task is a function that returns a promise
				promises.push(executing);
			}
			// Otherwise Task resolves immediately, continue
		});


		return Promise.all(promises);
	}

	// Adds a function to be run before a hook completes
	list(): Function[] {
		return this.hooks;
	}

	clear(): Function[] {
		return this.hooks = [];
	}
}
export default Hook;
