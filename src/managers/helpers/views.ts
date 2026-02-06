class Views {
	container: HTMLElement;
	_views: any[];
	length: number;
	hidden: boolean;

	constructor(container: HTMLElement) {
		this.container = container;
		this._views = [];
		this.length = 0;
		this.hidden = false;
	}

	all(): any[] {
		return this._views;
	}

	first(): any {
		return this._views[0];
	}

	last(): any {
		return this._views[this._views.length-1];
	}

	indexOf(view: any): number {
		return this._views.indexOf(view);
	}

	slice(...args: any[]): any[] {
		return this._views.slice.apply(this._views, arguments);
	}

	get(i: number): any {
		return this._views[i];
	}

	append(view: any): any {
		this._views.push(view);
		if(this.container){
			this.container.appendChild(view.element);
		}
		this.length++;
		return view;
	}

	prepend(view: any): any {
		this._views.unshift(view);
		if(this.container){
			this.container.insertBefore(view.element, this.container.firstChild);
		}
		this.length++;
		return view;
	}

	insert(view: any, index: number): any {
		this._views.splice(index, 0, view);

		if(this.container){
			if(index < this.container.children.length){
				this.container.insertBefore(view.element, this.container.children[index]);
			} else {
				this.container.appendChild(view.element);
			}
		}

		this.length++;
		return view;
	}

	remove(view: any): void {
		var index = this._views.indexOf(view);

		if(index > -1) {
			this._views.splice(index, 1);
		}


		this.destroy(view);

		this.length--;
	}

	destroy(view: any): void {
		if(view.displayed){
			view.destroy();
		}
		
		if(this.container){
			 this.container.removeChild(view.element);
		}
		view = null;
	}

	// Iterators

	forEach(...args: any[]): void {
		return this._views.forEach.apply(this._views, arguments);
	}

	clear(): void {
		// Remove all views
		var view;
		var len = this.length;

		if(!this.length) return;

		for (var i = 0; i < len; i++) {
			view = this._views[i];
			this.destroy(view);
		}

		this._views = [];
		this.length = 0;
	}

	find(section: any): any {

		var view;
		var len = this.length;

		for (var i = 0; i < len; i++) {
			view = this._views[i];
			if(view.displayed && view.section.index == section.index) {
				return view;
			}
		}

	}

	displayed(): any[] {
		var displayed = [];
		var view;
		var len = this.length;

		for (var i = 0; i < len; i++) {
			view = this._views[i];
			if(view.displayed){
				displayed.push(view);
			}
		}
		return displayed;
	}

	show(): void {
		var view;
		var len = this.length;

		for (var i = 0; i < len; i++) {
			view = this._views[i];
			if(view.displayed){
				view.show();
			}
		}
		this.hidden = false;
	}

	hide(): void {
		var view;
		var len = this.length;

		for (var i = 0; i < len; i++) {
			view = this._views[i];
			if(view.displayed){
				view.hide();
			}
		}
		this.hidden = true;
	}
}

export default Views;
