/**
 * Minimal EventEmitter mixin.
 * Drop-in replacement for the "event-emitter" npm package.
 * Supports on(type, fn), off(type, fn), emit(type, ...args).
 */
export default function EventEmitter(target: object): object {
	const proto = typeof target === "function" ? target.prototype : target;

	proto.on = function (type: string, fn: (...args: any[]) => void): unknown {
		if (!this.__listeners) this.__listeners = {};
		if (!this.__listeners[type]) this.__listeners[type] = [];
		this.__listeners[type].push(fn);
		return this;
	};

	proto.off = function (type: string, fn?: (...args: any[]) => void): unknown {
		if (!this.__listeners || !this.__listeners[type]) return this;
		if (fn) {
			this.__listeners[type] = this.__listeners[type].filter(function (f: (...args: any[]) => void) { return f !== fn; });
		} else {
			delete this.__listeners[type];
		}
		return this;
	};

	proto.emit = function (type: string, ...args: unknown[]): void {
		if (!this.__listeners || !this.__listeners[type]) return;
		const listeners = this.__listeners[type].slice();
		for (let i = 0; i < listeners.length; i++) {
			try {
				listeners[i](...args);
			} catch (err) {
				// Scoped per listener, not around the loop: one that throws must
				// not abort the rest.
				// eslint-disable-next-line no-console
				console.error(err);
			}
		}
	};

	return target;
}
