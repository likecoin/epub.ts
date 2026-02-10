/**
 * Minimal EventEmitter mixin.
 * Drop-in replacement for the "event-emitter" npm package.
 * Supports on(type, fn), off(type, fn), emit(type, ...args).
 */
export default function EventEmitter(target: any): any {
	const proto = typeof target === "function" ? target.prototype : target;

	proto.on = function (type: string, fn: (...args: any[]) => void): any {
		if (!this.__listeners) this.__listeners = {};
		if (!this.__listeners[type]) this.__listeners[type] = [];
		this.__listeners[type].push(fn);
		return this;
	};

	proto.off = function (type: string, fn?: (...args: any[]) => void): any {
		if (!this.__listeners || !this.__listeners[type]) return this;
		if (fn) {
			this.__listeners[type] = this.__listeners[type].filter(function (f: any) { return f !== fn; });
		} else {
			delete this.__listeners[type];
		}
		return this;
	};

	proto.emit = function (type: string, ...args: any[]): void {
		if (!this.__listeners || !this.__listeners[type]) return;
		const listeners = this.__listeners[type].slice();
		for (let i = 0; i < listeners.length; i++) {
			listeners[i](...args);
		}
	};

	return target;
}
