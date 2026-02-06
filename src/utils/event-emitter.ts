/**
 * Minimal EventEmitter mixin.
 * Drop-in replacement for the "event-emitter" npm package.
 * Supports on(type, fn), off(type, fn), emit(type, ...args).
 */
export default function EventEmitter(target: any): any {
	var proto = typeof target === "function" ? target.prototype : target;

	proto.on = function (type: string, fn: (...args: any[]) => void) {
		if (!this.__listeners) this.__listeners = {};
		if (!this.__listeners[type]) this.__listeners[type] = [];
		this.__listeners[type].push(fn);
		return this;
	};

	proto.off = function (type: string, fn?: (...args: any[]) => void) {
		if (!this.__listeners || !this.__listeners[type]) return this;
		if (fn) {
			this.__listeners[type] = this.__listeners[type].filter(function (f) { return f !== fn; });
		} else {
			delete this.__listeners[type];
		}
		return this;
	};

	proto.emit = function (type: string) {
		if (!this.__listeners || !this.__listeners[type]) return;
		var args = Array.prototype.slice.call(arguments, 1);
		var listeners = this.__listeners[type].slice();
		for (var i = 0; i < listeners.length; i++) {
			listeners[i].apply(this, args);
		}
	};

	return target;
}
