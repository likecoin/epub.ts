import type IframeView from "../views/iframe";
import type Section from "../../section";

class Views {
	container: HTMLElement;
	_views: IframeView[];
	length: number;
	hidden: boolean;

	constructor(container: HTMLElement) {
		this.container = container;
		this._views = [];
		this.length = 0;
		this.hidden = false;
	}

	all(): IframeView[] {
		return this._views;
	}

	first(): IframeView | undefined {
		return this._views[0];
	}

	last(): IframeView | undefined {
		return this._views[this._views.length-1];
	}

	indexOf(view: IframeView): number {
		return this._views.indexOf(view);
	}

	slice(...args: [start?: number, end?: number]): IframeView[] {
		return this._views.slice(...args);
	}

	get(i: number): IframeView | undefined {
		return this._views[i];
	}

	append(view: IframeView): IframeView {
		this._views.push(view);
		if(this.container){
			this.container.appendChild(view.element);
		}
		this.length++;
		return view;
	}

	prepend(view: IframeView): IframeView {
		this._views.unshift(view);
		if(this.container){
			this.container.insertBefore(view.element, this.container.firstChild);
		}
		this.length++;
		return view;
	}

	insert(view: IframeView, index: number): IframeView {
		this._views.splice(index, 0, view);

		if(this.container){
			if(index < this.container.children.length){
				this.container.insertBefore(view.element, this.container.children[index]!);
			} else {
				this.container.appendChild(view.element);
			}
		}

		this.length++;
		return view;
	}

	remove(view: IframeView): void {
		const index = this._views.indexOf(view);

		if(index > -1) {
			this._views.splice(index, 1);
		}


		this.destroy(view);

		this.length--;
	}

	destroy(view: IframeView): void {
		if(view.displayed){
			view.destroy();
		}

		if(this.container){
			 this.container.removeChild(view.element);
		}
	}

	// Iterators

	forEach(callbackfn: (value: IframeView, index: number, array: IframeView[]) => void): void {
		return this._views.forEach(callbackfn);
	}

	clear(): void {
		// Remove all views
		let view: IframeView;
		const len = this.length;

		if(!this.length) return;

		for (let i = 0; i < len; i++) {
			view = this._views[i]!;
			this.destroy(view);
		}

		this._views = [];
		this.length = 0;
	}

	find(section: Section): IframeView | undefined {

		let view: IframeView;
		const len = this.length;

		for (let i = 0; i < len; i++) {
			view = this._views[i]!;
			if(view.displayed && view.section.index == section.index) {
				return view;
			}
		}
		return undefined;
	}

	displayed(): IframeView[] {
		const displayed: IframeView[] = [];
		let view: IframeView;
		const len = this.length;

		for (let i = 0; i < len; i++) {
			view = this._views[i]!;
			if(view.displayed){
				displayed.push(view);
			}
		}
		return displayed;
	}

	show(): void {
		let view;
		const len = this.length;

		for (let i = 0; i < len; i++) {
			view = this._views[i]!;
			if(view.displayed){
				view.show();
			}
		}
		this.hidden = false;
	}

	hide(): void {
		let view;
		const len = this.length;

		for (let i = 0; i < len; i++) {
			view = this._views[i]!;
			if(view.displayed){
				view.hide();
			}
		}
		this.hidden = true;
	}
}

export default Views;
