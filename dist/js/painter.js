/**
 * Painter.js
 */

/**
 * The Painter object, which encapsulates everything. This is the only
 * object exposed to the global scope.
 * 
 * @type {Object}
 * @global
 * @namespace 
 */
var P = {

	/**
	 * The color used for bounding boxes, animation handles etc.
	 * 
	 * @type {String}
	 * @private
	 */
	mainColor: '#78C3D0',

	/**
	 * The animations registry. All registered animations are stored here. By 
	 * default, two animations, `rotate` and `bounce`, are registered.
	 * 
	 * @type {Object}
	 * @instance
	 */
	animations: {},


	/**
	 * Tool registry. By default, the following tools are registered:
	 * `select`, `drag`, `copy`, `rectangle`, `circle`, `manipulate` and the 
	 * animation tools `rotate` and `bounce`.
	 * 
	 * @type {Object}
	 * @instance
	 */
	tools: {},


	/**
	 * Action registry. By default, the following actions are registered:
	 * `delete`, `group`, `ungroup`, `clone`, `changeColor`, `play`, `pause`,
	 * `stop`, `playPause`, `bringToFront`, `sendToBack`.
	 * 
	 * @type {Object}
	 * @instance
	 */
	actions: {},

	/**
	 * Select an artefact or multiple artefacts.
	 * 
	 * @param  {Artefact[]} artefact One or multiple artefacts
	 * @return {Artefact[]}
	 * @instance
	 */
	select: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.select);
		return artefact.select();
	},

	/**
	 * Deselect an artefact
	 *
	 * This removes the bounding box and resets styling specific to selected
	 * items.
	 * @param  {Artefact[]} artefact One or multiple artefacts
	 * @return {Artefact[]}
	 * @instance
	 */
	deselect: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.deselect);
		return artefact.deselect();
	},

	/**
	 * Deselects all the currently selected artefacts.
	 *
	 * @return {Artefact[]} The artefacts that were deselected
	 * @instance
	 */
	deselectAll: function() {
		return P.getArtefacts().mmap('deselect');
	},

	/**
	 * Selects only this artefact and deselect all others.
	 * 
	 * @param {Artefact[]} aftefact The artefact or artefacts to select
	 * @return {Artefact[]} The selected artefact(s)
	 * @instance
	 */
	selectOnly: function(artefact) {
		P.deselectAll();
		return P.select(artefact);
	},

	/**
	 * Get all artefacts
	 * 
	 * @return {Artefact[]}
	 * @instance
	 */
	getArtefacts: function() {
		return Object.values(P.artefacts);
	},

	/**
	 * Return all selected artefacts
	 * 
	 * @return {Artefact[]}
	 * @instance
	 */
	getSelected: function() {
		return P.getArtefacts().filter(function(artefact) {
			return artefact.isSelected();
		})
	},

	/*****************************************************/

	/**
	 * Test if the artefact is a handle
	 * 
	 * @param  {paper.Item} item The handle
	 * @return {Boolean}
	 * @instance
	 */
	isHandle: function(item) {
		if(!item.name) return false;
		return item.name.startsWith('handle');
	},

	/**
	 * Test if an item is in a group
	 * @param  {paper.Item}	item
	 * @return {Boolean}
	 * @instance
	 */
	inGroup: function(item) {
		if(item.parent) return item.parent.className == 'Group';
		return false;
	},

	/**
	 * Test if an object is an artefact. It can test both whether a Paper.js
	 * item corresponds to an artefact or whether an object actually is
	 * an instance of {@link Artefact}, when `strict=true`.
	 * 
	 * @param  {paper.Item|Artefact} obj The object to Test
	 * @param  {Boolean} [strict=false] Only match objects that are actual 
	 * instances of {@link Artefact}?
	 * @return {Boolean}
	 * @instance
	 */
	isArtefact: function(obj, strict) {
		if(obj instanceof P.Artefact) return true;
		if(!strict && obj.data && obj.data._artefact) 
			return P.isArtefact(obj.data._artefact);
		return false;
	},

	/*****************************************************/

	/**
	 * Get the artefact corresponding to an item.
	 * 	
	 * @param  {paper.Item} item 
	 * @return {Artefact|Boolean} The Artefact or `false` if none was found.
	 * @instance
	 */
	getArtefact: function(item) {
		if(item.name == 'shadow') {
			return item.parent.data._artefact;
		}

		if(P.inGroup(item)) {
			var outerGroup = P.getOuterGroup(item);
			return P.getArtefact(outerGroup);
		}

		else if(item.data._artefact && P.isArtefact(item.data._artefact)) {
			return item.data._artefact;
		}

		else{
			return false
		}
	},

	/**
	 * Find the outermost group containing the item.
	 * 
	 * @param  {paper.Item} 	item 
	 * @return {paper.Group}  The outermost group containing `item`
	 * @instance
	 */
	getOuterGroup: function(item) {
		if(P.inGroup(item.parent)) return P.getOuterGroup(item.parent);
		return item.parent
	},

	/*****************************************************/

	/**
	 * Get the `i`'th of `num_color` equally spaced colors in the HSB spectrum.
	 * 
	 * @param  {Number}  i 					 Which color to fetch, by index.
	 * @param  {Number}  num_colors  Divide the spectrum in how many colors?
	 * @param  {Float}   [noise=0.4] Noise
	 * @param  {Boolean} css         If `true` it returns a CSS-friendly color string.
	 * @return {String}
	 * @instance
	 */
	getColor: function(i, num_colors, noise=.4, css=true) {
		var noise = Math.random() * noise - .5*noise
		var hue = ( (i+noise) / num_colors * 360 ) % 360
		if(hue < 0) hue = 360 + hue;
		var color = {
			hue: Math.round(hue),
			saturation: 75,
			brightness: 60
		}
		if(css) return "hsl(" + color.hue+', '+color.saturation+'%, '+color.brightness+'%)';
		else return color
	},
	
	/**
	 * Get the active swatch
	 * 
	 * @return {String} Color string
	 * @instance
	 */
	getActiveSwatch: function() {
		var index = $('.swatch.active').data('colorIndex');
		var numSwatches = $('.swatch.active').data('numSwatches');
		return P.getColor(index, numSwatches)
	},

	/**
	 * Export the drawing to an SVG string. All bounding boxes, animation 
	 * handles will be removed before exporting. Also, animated objects are
	 * reset to their original, non-animated position. The animation is stored
	 * in the data atttribute of the SVG element as a JSON object with the
	 * `type` and `properties` of the animation. These should allow the svg 
	 * to later be imported and animated
	 *
	 * @return {String} An SVG string
	 * @instance
	 */
	exportSVG: function() {

		// Deselect all
		var selected = P.getSelected();
		P.deselectAll();

		// Export animations
		var animating = P.getArtefacts().mfilter('isAnimating')
		animating.map(function(a) { a.getAnimation().stop(); });
		
		// Remove circular references
		var bboxes = P.getArtefacts().map(function(artefact){
			artefact.item.data._artefact = undefined;
			var output = {artefact: artefact};

			if(artefact.bbox) {
				artefact.bbox.data._artefact = undefined;
				output.bbox = artefact.bbox;
				output.index = artefact.bbox.index;
				output.parent = artefact.bbox.parent
				artefact.bbox.remove();
			}

			if(artefact.hasAnimation()) {
				artefact.item.data._animation = undefined
				var anim = artefact.getAnimation();
				artefact.item.data.animation = anim.export();
			}

			return output
		});

		var svg = paper.project.exportSVG({
			asString: true,
			matchShapes: true
		});

		// Restore bounding boxes
		bboxes.map(function(obj) {
			if(!obj.bbox) return false;
			console.log(obj)
			obj.artefact.bbox = obj.bbox;
			obj.parent.insertChild(obj.index, obj.bbox);
		})

		// Restore circular references
		P.getArtefacts().map(function(artefact){
			artefact.item.data._artefact = artefact;
			if(artefact.bbox) artefact.bbox.data._artefact = artefact;
			if(artefact.hasAnimation()) {
				artefact.item.data._animation = artefact.getAnimation();
			}
		});


		// Reset animations
		animating.map( function(a){a.getAnimation().start() })

		// Restore selection
		P.select(selected);

		return svg
	}

};


/**
 * Method Map: calls a method of every element in an array. This makes 
 * chaining super easy with arrays of Artefacts, for example.
 * 
 * This function is plugged into the Array prototype, so every array has this
 * method.
 * 
 * @example
 * // Get the currently selected artefacts
 * var artefacts = P.getSelected();
 * 
 * // First clone them and then select them
 * var move = [30, 40]
 * artefacts.mmap('clone', [move]).mmap('select');
 *
 * @param  {String} name The method to apply
 * @param  {Array} args An array of arguments passed to the method.
 * @return {Array}      An array with the result of every call
 * @inner
 * @memberof Array
 * @global
 */
Array.prototype.mmap = function(name, args) {
	return this.map(function(element) {
		return element[name].apply(element, args);
	});
}

/**
 * Method Filter. Just like {@link mmap}, it filters an array based on the
 * output of a method called on each of the elements. 
 *
 * This function is plugged into the Array prototype, so every array has this
 * method.
 *
 * @example
 * // Get all selected artefacts with an animation
 * var artefacts = getSelected().mfilter('hasAnimation')
 * 
 * @param  {string} name The name of the method to filter by
 * @param  {Array} args Optional arguments to pass to the method
 * @return {Array} The filtered array
 * @global
 */
Array.prototype.mfilter = function(name, args) {
	return this.filter(function(element) {
		return element[name].apply(element, args);
	});
}


/**
 * Register an action, i.e. a function wich operates on one or more artefacts,
 * such as deletion, cloning, grouping, ungrouping, etc. Actions are typically 
 * triggered via the user interface. Registered actions can be accessed at 
 * {@link P.actions} as `P.action.name` where `name` is the name of the action. 
 * Technically, an action is just a function taking an array of {@link Artefact} 
 * objects as its first input, and possibly other arguments:
 *
 * @example
 * var myAction = function(artefacts, other, arguments) {
 *   // Do something
 * }
 * P.registerAction('myAction', myAction);
 *
 * // Much later: perform the action
 * P.actions.myAction(P.getSelected(), 'some', 'arguments');
 * 
 * @param  {String} name   Unique name of the action
 * @param  {Function} action The action: a function that takes an array of 
 * artefacts as its first argument.
 */
P.registerAction = function(name, action) {
	P.actions[name] = action;
}

/**
 * Tools are registed with {@link P.registerTool}.
 * 
 * @namespace P.tools
 */

/**
 * Register a tool with the application. This allows the application to keep
 * track of all tools. Registered tools can be accessed via `P.tools.name` 
 * where `name` is the name of the tool.
 * 	
 * @param  {String} name Name of the tool
 * @param  {paper.Tool} tool The actual tool
 */
P.registerTool = function(name, tool) {
	P.tools[name] = tool;
}
;/**
 * History
 *
 * @class  Registers actions and implements undo/redo functionality. Actions 
 * are registered by providing two functions, `undo` and `redo`, that
 * take no other arguments (i.e., they are thunks). When registering 
 * these functions, care has to be taken that the right variables are
 * copied and scoped appropriately so that later actions do not change
 * the references in the `un/redo` functions. 
 *
 * History is always instantiated in `P.history`. Use this to register
 * new states.
 *
 * @name History
 * @memberOf P
 */
P.History = paper.Base.extend(/** @lends History */{

	initialize: function() {
		this.states = [{}];
		this.index = 0;
		this.maxStates = 50;
	},

	/**
	 * Register a state to the history
	 * 
	 * @param  {Function} undo An function that when called undoes the
	 * action. The function should take no arguments and take care of
	 * scoping and copying relevant variables itself.
	 * @param  {Function} redo A redo function that when called redoes
	 * the action undone by `undo`. Again, it takes no arguments.
	 * @instance
	 */
	registerState: function(undo, redo) {
		this.states = this.states.slice(0, this.index+1);
		this.states.push({redo: redo, undo: undo });
		this.index += 1;

		if(this.states.length > this.maxStates) {
			this.states = this.states.slice(this.states.length - this.maxStates);
			this.index = this.states.length - 1;
		}
	},

	/**
	 * Redo the last action
	 *
	 * Moves the index one step forward in the history, if possible.
	 * @instance
	 */
	redo: function() {
		if(this.index >= this.states.length-1) return false;
		this.index += 1;
		this.states[this.index].redo();
	},

	/**
	 * Undo the last action
	 * @instance
	 */
	undo: function() {
		if(this.index == 0) return false;
		this.states[this.index].undo();
		this.index -= 1;
	},

	canUndo: function() {
		return this.index > 0
	},

	canRedo: function() {
		return this.index < this.states.length - 1
	}
})

/**
 * Instance of the {@link P.History} class.
 * 
 * @type {P.History}
 * @memberOf P
 * @instance
 */
P.history = new P.History();

// Register actions
P.registerAction('undo', function() { P.history.undo() });
P.registerAction('redo', function() { P.history.redo() })
;/**
 * An object tracking all artefacts. Artefacts are registered by the id of
 * the item. To get an array, just use `Object.values(P.artefacts)` or call
 * `P.allArtefacts()`.
 * 
 * @private
 * @type {Object}
 */
P.artefacts = {}

/**
 * @name Artefact
 * @class The main artefact class
 * @memberOf P
 */
P.Artefact = paper.Base.extend(/** @lends Artefact */{
	
	/**
	 * @private
	 * @type {String}
	 */
	_class: 'Artefact',

	/**
	 * Constructor
	 */
	initialize: function(item) {
		this.item = item;
		this.item.data._artefact = this;
		this.animation = undefined;
		this.shadow = undefined;
		this.selected = false;

		// Register artefact by id
		P.artefacts[item.id] = this
	},

	/**
	 * Show the bounding box of the current artefact
	 * 
	 * @return {Artefact} This artefact
	 * @instance
	 */
	showBoundingBox: function() {
		if(!this.bbox) this.drawBoundingBox();
		this.bbox.visible = true;
		return this;
	},

	/**
	 * Hide the bounding box
	 * 
	 * @return {Artefact} This artefact
	 * @instance
	 */
	hideBoundingBox: function() {
		if(this.bbox) this.bbox.visible = false;
		return this;
	},

	/**
	 * Completely remove the bounding box of this artefact
	 * 
	 * @return {Artefact} This artefact
	 * @instance
	 */
	removeBoundingBox: function() {
		this.hideBoundingBox();
		if(this.bbox) this.bbox.remove();
		this.bbox = undefined;
		return this;
	},

	/**
	 * Draw the bounding box of the artefact.
	 * 
	 * This function relies on the `_drawBoundingBox` in one of the inheriting 
	 * classes {@link Artefact.Rectangle}, {@link Artefact.Circle} or {@link Artefact.Group}, 
	 * which actually generates the handles, border and shadow element.
	 * 	
	 * @return {Aftefact} This artefact
	 * @instance
	 */
	drawBoundingBox: function() {
		if(!this._drawBoundingBox) {
			console.log('ERROR!')
			return
		}
		
		// Clean up
		this.removeBoundingBox();

		var parts = this._drawBoundingBox();
		this.shadow = parts.shadow;
		this.shadow.fillColor = P.mainColor;
		this.shadow.opacity = 0.1;
		this.shadow.name = 'shadow'
		delete this.shadow.data._artefact
		
		var border = parts.border;
		border.name = 'border';
		border.strokeColor = P.mainColor;

		var children = [parts.border].concat(parts.handles).concat([this.shadow]);
		this.bbox = new paper.Group(children);
		this.bbox.parent = this.item.parent;
		this.bbox.pivot = this.shadow.bounds.center;

		// TODO: this.bbox.data._item?
		this.bbox.data._artefact = this;
		this.bbox.name = 'bbox';

		this.item.insertBelow(this.bbox);
	},

	/**
	 * Generate a handle object
	 *
	 * @private
	 * @param  {Point} position The position for the handle
	 * @return {Path}
	 */
	_getHandle: function(position) { 
		var handle = new paper.Path.Circle({
			center: position, 
			radius: 4,
			strokeColor: P.mainColor,
			fillColor: 'white'
		})

		handle.on('mouseenter', function() {
			this.fillColor = P.mainColor
		})

		handle.on('mouseleave', function() {
			this.fillColor = 'white'
		})

		handle.name = 'handle'

		return handle
	},

	/**
	 * @summary Test if this Artefact is selected
	 * @return {Boolean}
	 * @instance
	 */
	isSelected: function() {
		return this.selected == true;
	},

	/**
	 * Select the current artefact. If an artefact is selected, the bounding box and 
	 * animation handles, if they exist, are shown. 
	 * 
	 * @return {Artefact}
	 * @instance
	 */
	select: function() {
		if(!this.isSelected()) {
			this.showBoundingBox();
			if(this.hasAnimation()) this.getAnimation().drawHandles();
			this.selected = true;
		}
		return this;
	},

	/**
	 * Deselect this artefact. Removes the bounding box and animation handles.
	 * 
	 * @return {Artefact}
	 * @instance
	 */
	deselect: function() {
		this.hideBoundingBox();
		this.item.strokeColor = undefined;
		this.item.dashArray = undefined;
		if(this.hasAnimation())
			this.getAnimation().removeHandles();
		this.selected = false;
		return this;
	},

	/**
	 * Animate the artefact. This adds an {@link Animation} object of a certain type to the
	 * artefact. 
	 * 
	 * @param  {String} type       The type of animation, e.g. 'bounce' or 'rotate'.
	 * @param  {Object} properties Properties for this animation. The shape of this object
	 * differs across types of animations. 
	 * @return {Animation}         The animation object
	 * @instance
	 */
	animate: function(type, properties) {
		this.removeAnimation()

		var anim = new P.Animation(this, type, properties);
		this.anim = anim;
		return this.anim;
	},

	/**
	 * Completely removes the animation from this artefact, if any exists.
	 * @return {undefined}
	 * @instance
	 */
	removeAnimation: function() {
		if(!this.hasAnimation()) return;
		this.getAnimation().remove()
		this.anim = undefined;
	},

	/**
	 * Get the animation object.
	 * 
	 * @return {Animation} The animation object, an instance of {@link Animation}.
	 * @instance
	 */
	getAnimation: function() {
		return this.anim;
	},

	/**
	 * Test if this artefact has an animation.
	 * 	
	 * @param  {Boolean|String} [type=false] If `type` is specified, it also checks
	 * if the animation is of the given type
	 * @return {Boolean}
	 * @instance
	 */
	hasAnimation: function(type) {
		if(!this.getAnimation()) return false;
		if(type) return this.getAnimation().type == type;
		return true;
	},

	/**
	 * Test if this artefact is currently animating, that is, if the animation is active.
	 * 	
	 * @return {Boolean}
	 * @instance
	 */
	isAnimating: function() {
		return this.hasAnimation() ? this.getAnimation().isActive() : false;
	},

	/**
	 * Get the so called 'shadow bounds'. The *shadow* object is the heart of 
	 * the bounding box and has the same shape as the Artefact. The shadow (and 
	 * bounding box) stay in place when the artefact is animated. In this way, 
	 * the shadow provides a way to find out the exact dimensions of an artefact
	 * if the animation would be removed, without ever having to stop the 
	 * animation. The bounds of the shadow are thus of special importance.
	 *
	 * For groups, the shadow bounds are computed recursively, by combining the 
	 * shadow bounds of children up to a certain depth.
	 * 
	 * @param  {Number} [depth=1] How deep the recursion should go; only used 
	 * when computing the bounds of a {@link Artefact.Group}.
	 * @return {paper.Rectangle} The bounds
	 * @instance
	 */
	getShadowBounds: function(depth=1) {
		return this.shadow ? this.shadow.bounds : false;
	},

	/**
	 * Transform this item. The transformation will also be applied to the 
	 * bounding box and the animation (handles). In this way, the artefact always
	 * moves as a single unit.
	 * 
	 * @param  {paper.Matrix} matrix The transformation Matrix
	 * @return {Artefact}
	 * @instance
	 */
	transform: function(matrix) {
		this.item.transform(matrix);
		if(this.bbox) this.bbox.transform(matrix);
		if(this.hasAnimation()) this.getAnimation().transform(matrix);
		return this;
	},

	/**
	 * Move the item by a specified distance. Internally, the {@link Artefact.transform}
	 * method is used.
	 * 
	 * @param  {paper.Point} delta The distance by which the item should be moved.
	 * @return {Artefact}
	 * @instance
	 */
	move: function(delta) {
		var matrix = new paper.Matrix().translate(delta);
		this.transform(matrix);
		return this;
	},

	/**
	 * Destroy this artefact
	 * 
	 * @return {}
	 * @instance
	 */
	destroy: function() {
		this.deselect();
		if(this.bbox) {
			this.bbox.remove();
			delete this.bbox;
		}
		
		this.removeAnimation();

		// Remove the item the very end!
		this.item.remove();
		delete P.artefacts[this.id];
	},

	/**
	 * Restore this artefact. After destroying the artefact, a reference to it
	 * might still exist. In that case, `restore` can be called to, yes, restore
	 * the artefact. This is typically used in undo/redo settings.
	 * 
	 * @return {Artefact}
	 * @instance
	 */
	restore: function() {
		paper.project.activeLayer.addChild(this.item);
		if(this.hasAnimation()) this.getAnimation().start;
		P.artefacts[this.id] = this;
		return this;
	},

	/**
	 * Clone the artefact. This should result in a deep copy, with no references
	 * to the original artefact. Paper items, bounding boxes, animations, all
	 * should be copied.
	 * 	
	 * @param  {Boolean|Artefact} [copy=false] If a copy is given, the current item
	 * is not cloned, but the copy is further updated to mirror the current artefact.
	 * @return {Artefact} A clone of the original artefact.
	 * @instance 
	 */
	clone: function(copy=false) {

		// Construct new copy
		var Class = this.className ? P.Artefact[this.className] : P.Artefact;
		var copy = copy || new Class(this.item.clone());

		// Clone bounding box
		copy.bbox = this.bbox.clone();
		copy.bbox.name = 'bbox';
		copy.bbox.data._artefact = copy;

		// Update names of children of bbox
		for(var i=0; i<copy.bbox.children.length; i++){
			var child = copy.bbox.children[i];
			if(child.name) child.name = child.name.replace(' 1', '')
		}
		copy.shadow = copy.bbox.children['shadow'];
		copy.shadow.getBounds()

		// Clone animation
		if(this.hasAnimation()) {
			var anim = this.getAnimation();
			var props = anim.cloneProperties();
			copy.animate(anim.type, props);
			copy.getAnimation().start();
		}

		// Select and return
		copy.selected = false;
		this.deselect();
		copy.select();

		return copy;
	},

	/**
	 * Test if this artefact is a {@link Artefact.Rectangle}
	 * @return {Boolean}
	 * @instance
	 */
	isRectangle: function() {
		return this instanceof P.Artefact.Rectangle;
	},

	/**
	 * Test if this artefact is a {@link Artefact.Circle}
	 * @return {Boolean} [description]
	 * @instance
	 */
	isCircle: function() {
		return this instanceof P.Artefact.Circle;
	},

	/**
	 * Manipulate the artefact using an {@link paper.ToolEvent}. The behaviour
	 * is different for different artefacts and overridden by inheriting classes.
	 * 
	 * @param  {paper.ToolEvent} event
	 * @param  {paper.Item} handle The handle hit by the event
	 * @return {}
	 * @instance
	 */
	manipulate: function(event, handle) {},

	bringToFront: function() {
		this.item.bringToFront();
	},

	sendToBack: function() {
		this.item.sendToBack();
	}

})

/**
 * @name Rectangle
 * @class A rectangular Artefact. Yes, really just a rectangle.
 * @memberOf P.Artefact
 */
P.Artefact.Rectangle = P.Artefact.extend(/** @lends Artefact.Rectangle */{

	_class: 'Rectangle',

	/**
	 * Constructor
	 * @param  {paper.Item|args} args Either a rectangular paper.Item or arguments
	 * that can be passed to the paper.Path.Rectangle constructor.	
	 * @return {}
	 */
	initialize: function(args) {
		var item;
		if(args instanceof paper.Item) {
			item = args;
		} else{
			item = new paper.Path.Rectangle(args);
		}
		P.Artefact.apply(this, [item]);
	},

	/**
	 * Draws the bounding box for a rectangular artefact.
	 * @private
	 */
	_drawBoundingBox: function() {
		var handles = [];
		var shadow = this.item.clone();

		// The border of the bounding box (expanded slightly)
		var border = new paper.Path.Rectangle(shadow.bounds.expand(12))

		// Name the segments
		var self = this;
		var names = ['bottomLeft', 'topLeft', 'topRight', 'bottomRight'];
		var handles = this.item.segments.map(function(segment){

			// Find the name of this segment
			var name = names.filter(function(name) { 
				var position = shadow.bounds[name];
				return segment.point.equals(position);
			})[0];
			
			// Create the handle
			var position = border.bounds[name];
			var handle = self._getHandle(position);
			handle.name = 'handle:' + name;
			segment.name = name;
			
			return handle
		});

		return {
			shadow: shadow,
			handles: handles,
			border: border
		}
	},

	/**
	 * @private
	 * @param  {ToolEvent} event
	 * @param  {Item} handle [description]
	 */
	manipulate: function(event, handle) {
		if(this.isAnimating()) return false;

		var index, segments, adjacents, sameX, sameY, newWidth, newHeight, deltaX, deltaY;
		var itemIndex = this.item.index;
		// Get segment corresponding to the handle, and segments adjacent to that
		index = handle.parent.children.indexOf(handle) - 1;
		segment = this.item.segments[index];
		adjacents = this._getAdjacentSegments(segment);
		sameX = adjacents.sameX;
		sameY = adjacents.sameY;
		
		// Move segments
		// To do: this is still a bit buggy... You sometimes get crosses, or the
		// rectangle is essentially removed. Could the problem be in getAdjacentSegments ?
		newWidth  = Math.abs(segment.point.x - (sameY.point.x + event.delta.x));
		newHeight = Math.abs(segment.point.y - (sameX.point.y + event.delta.y));
		deltaX = (newWidth <= 3) ? 0 : event.delta.x;
		deltaY = (newHeight <= 3) ? 0 : event.delta.y;
		sameX.point   = sameX.point.add([deltaX, 0]);
		sameY.point   = sameY.point.add([0, deltaY]);
		segment.point = segment.point.add([deltaX, deltaY]);

		// Update bounding box
		this.drawBoundingBox();

		// Keep the item at the same 'vertical' position
		this.item.parent.insertChild(itemIndex, this.item);

		// Color selected handle
		// Todo: doesn't work when flipping a rectangle, but at least the code is
		// simple and readable again.
		var newHandle = this.bbox.children[handle.name];
		newHandle.fillColor = P.mainColor;
	},

	/**
	* Get the adjacent segments of a given segment on a rectangle
	* @private
	* @param  {Segment} segment 
	* @return {Object} Object containing the segment with the same X 
	* and the one with the same Y coordinate.
	*/
	_getAdjacentSegments: function(segment) {
		var adjacents = {
			'bottomRight': 	{ sameX: 'topRight', 		sameY: 'bottomLeft'},
			'bottomLeft': 	{ sameX: 'topLeft', 		sameY: 'bottomRight'},
			'topLeft': 			{ sameX: 'bottomLeft', 	sameY: 'topRight'},
			'topRight': 		{ sameX: 'bottomRight', sameY: 'topLeft'},
		}[segment.name];
		
		// Store all segments by name
		var segmentsByName = {}
		for(var i=0; i<segment.path.segments.length; i++) {
			var segm = segment.path.segments[i];
			segmentsByName[segm.name] = segm;
		}
		
		return { 
			sameX: segmentsByName[adjacents.sameX],
			sameY: segmentsByName[adjacents.sameY],
		}
	}

});

/**
 * @name Circle
 * @class  A circular Artefact.
 * @memberOf P.Artefact
 */
P.Artefact.Circle = P.Artefact.extend(/** @lends Artefact.Circle */{
	_class: 'Circle',

	initialize: function(args) {
		var item;
		if(args instanceof paper.Item) {
			item = args;
		} else {
			item = new paper.Path.Circle(arguments[0], arguments[1] );
		}
		P.Artefact.apply(this, [item])
	},

	_drawBoundingBox: function() {
		var shadow = this.item.clone();
		var radius = (this.item.bounds.width + 12) / 2
		var center = this.item.position 
		var border = new paper.Path.Circle(this.item.position, radius)
		var handle = this._getHandle([center.x + radius, center.y])
		return {
			shadow: shadow,
			handles: [handle],
			border: border
		};
	},

	manipulate: function(event, handle) {
		if(this.isAnimating()) return false;
		var item = this.item;
		var index = item.index;
		var center = item.position,
					radius = item.bounds.width,
					newRadius = event.point.subtract(center).length * 2 - 6,
					scaleFactor = newRadius/radius;
		item.scale(scaleFactor);
		this.drawBoundingBox();

		// Keep the item at the same 'vertical' position
		item.parent.insertChild(index, item);

		// Color the selected handle
		var newHandle = this.bbox.children[1];
		newHandle.fillColor = P.mainColor;
	}

})

/**
 * @name Group
 * @class The group Artefact is an artefact consisting of several others.
 * It is really just a group with some added niceties.
 * @memberOf P.Artefact
 */
P.Artefact.Group = P.Artefact.extend(/** @lends Artefact.Group */{
	_class: 'Group',

	initialize: function(artefacts) {
		
		var items = artefacts.map(function(a) { return a.item });
		var group = new paper.Group(items);
		P.Artefact.apply(this, [group]);

		this.children = artefacts;
		this.item.transformContent = false;
		var bounds = this.getShadowBounds(0);
		group.pivot = new paper.Point(bounds.center);

		// Select only the group!
		this.children.mmap('deselect');
	},

	/**
	 * Override the default clone method 
	 * 
	 * @private
	 * @return {Artefact.Group}
	 */
	clone: function clone() {
		this.deselect();
		var clonedChildren = this.children.mmap('clone').mmap('deselect')
		var	copy = new P.Artefact.Group(clonedChildren);
		clone.base.call(this, copy);
		copy.item.transform(this.item.matrix)
		return copy
	},

	/**
	 * Override the default getShadowBounds. Instead, compute the shadow bounds,
	 * by recursively combining the shadow bounds of children.
	 *
	 * @private
	 * @param  {Number} [depth=1] How deep the recursion should go
	 * @return {paper.Rectangle}
	 */
	getShadowBounds: function(depth) {
		var depth = depth || 1;
		// Get the shadow bounds only up to a certain depth
		if(this.shadow && depth == 0){
			return this.shadow.bounds
		}

		// For groups we combine all shadow bounds
		var bounds;
		for(var i=0; i<this.children.length;i++){
			var child = this.children[i];	
			var childBounds = child.getShadowBounds(depth-1);
			bounds = bounds ? bounds.unite(childBounds) : childBounds;
		}
		return bounds
	},

	/**
	 * Draw bounding box around the group
	 * @private
	 */
	_drawBoundingBox: function() {
		// The item's shadow
		var bounds = this.getShadowBounds();
		var shadow = new paper.Path.Rectangle(bounds);
		shadow.transform(this.item.matrix)

		// The border of the bounding box (expanded slightly)
		var border = new paper.Path.Rectangle(shadow.bounds.expand(12))
		border.dashArray = [5,2];
		
		// Handles
		var self = this;
		var handles = border.segments.map(function(segment) {
			return self._getHandle(segment.point);
		})

		return {
			shadow: shadow,
			handles: handles,
			border: border
		} 
	},

	/**
	 * Manipulate the group, that is, scale it.
	 *
	 * @private
	 * @param {paper.ToolEvent} event
	 * @param {paper.Item} handle
	 */
	manipulate: function(event, handle) {
		if(this.isAnimating()) return false;
		
		var index = this.item.index,
				bounds = this.item.bounds,
				center = this.item.position,
				width = bounds.width,
				height = bounds.height,
				diag = Math.sqrt(width*width + height*height),
				newDiag = event.point.subtract(center).length * 2 - 6,
				scaleFactor = newDiag/diag;

		this.item.scale(scaleFactor);

		// Update the selection box
		this.drawBoundingBox();

		// Keep the item at the same 'vertical' position
		this.item.parent.insertChild(index, this.item);

		// Color selected handle
		if(this.bbox.children[handle.name])
			this.bbox.children[handle.name].fillColor = P.mainColor;
	},

	/**
	 * Ungroup. Destroys the group and inserts the children Artefact at the
	 * same position in the layer.
	 * 
	 * @return {Artefact[]} Artefacts
	 */
	ungroup: function() {
		// Reinstert parent items
		var childItems = this.children.map(function(child){ return child.item });
		var parent = this.item.parent ? this.item.parent : paper.project.activeLayer;
		parent.insertChildren(this.item.index, childItems);

		// Stop the animation, to get the actual transformation of the group
		if(this.hasAnimation()) this.animation.stop();
		var matrix = this.item.matrix;
		this.children.map(function(child) { 
			
			// The children of groups are not transformed untill
			// we ungroup them!
			child.bbox.visible=true
			child.transform(matrix);

			// Reset the bounding box
			if(child.isAnimating()) {
				child.animation.stop();
				child.drawBoundingBox();
				child.animation.start();
			} else {
				child.drawBoundingBox();	
			}
			
		});
		
		// Remove and reset
		this.destroy(false);
		return this.children;
	},

	/**
	 * Override the default destroy
	 * @param  {Boolean} [destroyChildren=true] Destroy the children as well?
	 * @return {}
	 */
	destroy: function destroy(destroyChildren=false) {
		if(destroyChildren) this.children.mmap('destroy');
		destroy.base.call(this);
	}
});/**
 * Registered actions. Actions are functions that operate on one or multiple
 * artefacts. They are registered via {@link P.registerAction} and stored in 
 * {@link P.actions}.
 * 
 * @namespace  P.actions
 */


// Define all actions, but encapsulate in a module in order not to pollute the
// global scope.
(function() {
	/**
	 * Delete the artefacts
	 * 
	 * @param  {Artefact[]} artefacts
	 * @memberOf P.actions
	 * @function delete
	 * @instance
	 */
	var del = function(artefacts) {

		var undo = function() {
			artefacts.mmap('restore').mmap('select');
		}

		var redo = function() {
			artefacts.mmap('destroy');
		}
		
		P.history.registerState(undo, redo);

		redo();
	}
	P.registerAction('delete', del);


	/**
	 * Group an array of artefacts
	 *
	 * @todo The undo operation breaks the history...
	 * @param  {Artefact[]} artefacts The artefacts to group.
	 * @return {Artefact.Group}
	 * @memberOf P.actions
	 * @instance
	 */
	var group = function(artefacts) {

		var undo = function() {
			// To do: this breaks up the history chain since we no 
			// longer refer to the same group...
			artefact.ungroup().mmap('select');
		}

		var redo = function() {
			return artefact = new P.Artefact.Group(artefacts).select();
		}

		P.history.registerState(undo, redo)		

		// Perform the action
		return redo();
	}

	P.registerAction('group', group);

	/**
	 * Ungroup an {@link Artefact.Group}. 
	 * 
	 * Note that there is no ungrouping procedure in  Paper.js 
	 * ([see here](https://github.com/paperjs/paper.js/issues/1026)),
	 * so we implement our own ungrouping operation.
	 * 
	 * @param  {Artefact.Group} 
	 * @return {Artefact[]} An array of children artefacts
	 * @memberOf P
	 * @instance
	 */
	var ungroup = function(theGroup) {
		if(theGroup instanceof Array) return theGroup.map(ungroup);
		if(!theGroup.ungroup) return false;
		var children;

		var redo = function() {
			children = theGroup.ungroup();
			return children.mmap('select');
		}

		var undo = function() {
			theGroup = new P.Artefact.Group(children);
		}

		P.history.registerState(undo, redo);
		
		// Perform the action
		return redo();
	}

	P.registerAction('ungroup', ungroup);

	/**
	 * Clone the currently selected artefacts
	 * 
	 * @param  {Artefact[]} artefacts	asdf	
	 * @param  {Array|paper.Point} [move=[0,0]] Move the clones by this distance.
	 * Defaults to no movement (`[0,0]`).
	 * @return {Artefacts[]} The cloned artefacts
	 * @memberOf P
	 * @instance
	 */
	var clone = function(artefacts, move) {
		var move = move || [0,0];
		var clones = artefacts.mmap('clone').mmap('move', [move]);
		P.selectOnly(clones);

		var undo = function() {
			clones.mmap('destroy');
		}
		var redo = function() {
			clones.mmap('restore').mmap('select');
		}
		P.history.registerState(undo, redo)

		return clones;
	}

	P.registerAction('clone', clone);

	/**
	 * Change the color of the artefacts
	 * 	
	 * @param {Artefact[]} artefacts
	 * @param {String} [swatch=null] The swatch to use. Defaults to the
	 * active swatch.
	 * @memberOf P.actions
	 * @instance
	 */
	var changeColor = function(artefacts, swatch) {
		var swatch = swatch || P.getActiveSwatch();
		var origColors;
		
		var redo = function() {
			origColors = artefacts.map(function(artefact) {
				var origColor = artefact.item.fillColor;
				artefact.item.fillColor = swatch;
				return origColor;
			});
		}

		var undo = function() {
			artefacts.map(function(artefact) {
				var idx = artefacts.indexOf(artefact);
				artefact.item.fillColor = origColors[idx];
			});
		}
		
		P.history.registerState(undo, redo);

		redo();
	}
	P.registerAction('changeColor', changeColor);


	/**
	 * Play (or start) the artefacts that have an animation.
	 * 	
	 * @param  {Artefact[]} artefacts 
	 * @return {Artefact[]} those of the passed artefacts that have an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var play = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().start();
		})
	}
	P.registerAction('play', play);

	/**
	 * Pause the animated artefacts
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} Those of the passed artefacts with an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var pause = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().pause();
		})
	}
	P.registerAction('pause', pause);

	/**
	 * Stop the animated artefacts
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} Those of the passed artefacts with an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var stop = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().stop();
		})
	}
	P.registerAction('stop', stop);

	/**
	 * Play or pause the animation. The first artefact is used as a reference:
	 * it this is animating, all animations (of the artefacts passed to the
	 * function) will be paused, otherwise all will be started.
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} Those of the passed artefacts with an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var playPause = function(artefacts) {
		var artefacts = artefacts.mfilter('hasAnimation');
		if(artefacts[0].isAnimating()) {
			return pause(artefacts)
		} else {
			return play(artefacts);
		}
	}
	P.registerAction('playPause', playPause);

	/**
	 * Bring the artefacts to the front
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} 
	 * @memberOf P.actions
	 * @instance
	 */
	var bringToFront = function(artefacts) {
		var indices;

		var redo = function() {
			indices = artefacts.map(function(artefact) {
				return artefact.item.index
			});
			return artefacts.mmap('bringToFront');
		}

		var undo = function() {
			for(var i=0; i<artefacts.length; i++) {
				var artefact = artefacts[i];
				artefact.item.parent.insertChild(indices[i], artefact.item);
			}
		}

		P.history.registerState(undo, redo);

		return redo();
	}
	P.registerAction('bringToFront', bringToFront);

	/**
	 * Send artefacts to the back
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]}
	 * @memberOf P.actions
	 * @instance
	 */
	var sendToBack = function(artefacts) {
		var indices;

		var redo = function() {
			indices = artefacts.map(function(artefact) {
				return artefact.item.index
			});
			return artefacts.mmap('sendToBack');
		}

		var undo = function() {
			for(var i=0; i<artefacts.length; i++) {
				var artefact = artefacts[i];
				artefact.item.parent.insertChild(indices[i], artefact.item);
			}
		}

		P.history.registerState(undo, redo);

		return redo();
	}
	P.registerAction('sendToBack', sendToBack);

})();

;/**
 * @name Animation
 * @class The main animation class
 * @property {Artefact} artefact The artefact being animated
 * @property {String} type The type of animation. This must correspond to a 
 * registered animation such as `bounce` or `rotate`.
 * @property {Object} properties All properties determining the animation.
 * @memberOf P
 */
P.Animation = paper.Base.extend(/** @lends Animation */{

	/**
	 * Initialize an animation.
	 *
	 * @param  {paper.Item} item The Paper item to animate.
	 * @param  {String} type Animation type, such as 'bounce' or 'rotate'.
	 * @param  {Object} properties Default properties.
	 * @return {Animation}
	 */
	initialize: function(artefact, type, properties) {
		this.artefact = artefact;
		this.item = artefact.item;
		this.item.data._animation = this;
		this.type = type;
		this.properties = jQuery.extend(true, {}, properties);

		// Load all animation-specific methods.
		var actions = ['onInit', 'onStart', 'onPause', 'onStop', 'onFrame', 
		'onTransform', 'onDrawHandles', 'onUpdate'];
		for(var i=0; i<actions.length; i++) {
			var action = actions[i];
			this['_'+action] = P.animations[this.type][action] || function() {};
		}

		this._onInit(this.artefact, this.properties);
		this.drawHandles();
	},

	/**
	 * Draw the animation handles
	 * 
	 * @return {Animation}
	 * @instance
	 */
	drawHandles: function() {
		// Clean up old animations
		this.removeHandles(this);

		// Draw handles
		var handles = this._onDrawHandles(this.artefact, this.properties);
		handles.parent = this.artefact.bbox;
		handles.name = 'handle:animation';
		this.handles = handles;
		return handles;
	},

	/**
	 * Remove the animation handles
	 * 
	 * @return {Animation}
	 * @instance
	 */
	removeHandles: function(self) {
		if(this.handles != undefined) {
			this.handles.remove();
			this.handles = undefined;
		}		
		return this;
	},

	/**
	 * Update the properties of the animation. The update is often triggered by 
	 * an event, such as a ToolEvent fired when moving the animation handles. In 
	 * this case, the event itself can be passed to the update function. 
	 * Alternatively, you can feed an object with the new properties.
	 *
	 * @param {paper.Event|Object} argument Either a Paper event or an object 
	 * with properties.
	 * @return {Object} The updated properties
	 * @instance
	 */
	update: function(argument) {
		var properties;
		if(argument instanceof paper.Event) {
			properties = this._onUpdate(this.artefact, this.properties, argument);
		} else {
			properties = argument;
		}

		this.properties = jQuery.extend(this.properties, properties);
		this.drawHandles();
		return this.properties;
	},

	/**
	 * Start the animation
	 * @param  {Boolean} recurse [description]
	 * @return {Animation}
	 * @instance
	 */
	start: function(recurse=true) {
		this.active = true;
		this._onStart(this.artefact, this.properties);

		// Start the animation
		var artefact = this.artefact;
		var anim = this;
		this.item.onFrame = function(event) {
			anim._onFrame(artefact, anim.properties, event);
			// if(artefact.isSelected()) anim.drawHandles();
		}

		return this;
	},

	/**
	 * Pause the animation in its current state.
	 * 
	 * @return {Animation}
	 * @instance
	 */
	pause: function() {
		this.active = false;
		this.item.onFrame = undefined;
		this._onPause(this.artefact, this.properties);
		return this;
	},

	/**
	 * Stops the animation: pause the animation and reset the item to its 
	 * original state.
	 * 
	 * @return {Animation}
	 * @instance
	 */
	stop: function() {
		this.pause();
		this._onStop(this.artefact, this.properties);
		return this;
	},

	/**
	 * Remove the animation. It does not actually remove the animation object,
	 * but resets the animation and removes all items drawn on the canvas, such
	 * as handles.
	 * 
	 * @return {Animation}
	 * @instance
	 */
	remove: function() {
		this.stop();
		this.removeHandles();
		delete this.item.data._animation
	},

	/**
	 * Apply a transformation to the animation.
	 * 
	 * @param  {paper.Matrix} matrix The transformation matrix
	 * @return {Animation}
	 * @instance
	 */
	transform: function(matrix) {
		this._onTransform(this.artefact, this.properties, matrix);
		return this;
	},

	/**
	 * Test if this animation is active: if the animation is currently running.
	 * If the animation is paused or stopped, `isActive` returns `false`.
	 * 
	 * @return {Boolean}
	 * @instance
	 */
	isActive: function() {
		return this.active == true;
	},

	/**
	 * Create a (deep) copy of the animation properties
	 * 
	 * @return {Object} copy of the properties
	 * @instance
	 */
	cloneProperties: function() {
		return jQuery.extend(true, {}, this.properties);
	},

	/**
	 * Export the animation as a plain object which fully determines the
	 * animation. (Currently, that's just its `properties` and `type`).
	 * 
	 * @return {Object}
	 * @instance
	 */
	export: function() {
		return {
			'properties': this.cloneProperties(),
			'type': this.type + ''
		}
	}
})

/**
 * Animations registered with {@link P.registerAnimation}. Animation objects
 * are plain objects containing various methods that allow us to animate 
 * artefacts; see {@link P.registerAnimation} for details.
 * 
 * @namespace P.animations
 */

/**
 * Register an animation
 *
 * An animation moves an item periodically based on several parameters which
 * are set graphically by a set of handles. The rotation animation for example
 * has a single parameter: the center point around which the item rotates. 
 * The drawing app iteracts with the animation through various functions. The 
 * most important ones are
 * 
 * - `onUpdate(item, properties, event)` should update the properties object 
 * based on a mouse event. This function is called whenever the animation 
 * tool is active and the mouse moves. The properties determined here are
 * passed to all functions below.
 * - `onFrame(item, properties, events)` updates the object based on the properties,
 * event etc. This is the core of the animation
 * - `drawHandles(item, properties)` returns a `Group` with the handles
 * - `onTransform(item, properties, matrix)` handles a transform of the item.
 * The properties probably contain some point in a relative coordinate system.
 * This function should apply the matrix to that point.
 * - `onStop(item, properties)` Should undo the animation and reset the item.
 *
 * @param  {String} type              Name of the animation
 * @param  {Object} animation         Animation object
 * @param  {Object} defaultProperties Default properties
 * @return {Object} The animation
 * @memberOf P
 * @instance 
 */
P.registerAnimation = function(type, newAnimation, defaultProperties) {
	
	// Set up the animation tool
	var animTool = newAnimation.tool || new paper.Tool();

	// The current item on which the tool works.
	var artefact;
	var prevAnimation;

	// On Mouse Down
	var _onMouseDown = function(event) {
		artefact = P.getSelected()[0]
		if(artefact == undefined) {
			hitResult = paper.project.hitTest(event.point, {
				fill: true, 
				tolerance: 5,
			})
			if(!hitResult) return false;
			artefact = P.getArtefact(hitResult.item)
		}
		P.selectOnly(artefact);

		// Previous animation
		prevAnimation = artefact.hasAnimation() ? artefact.getAnimation().export() : {};

		// Animate.
		artefact.animate(type, defaultProperties);
		

		// Update the properties.
		artefact.getAnimation().update(event);
	}

	// Mouse drag event
	var _onMouseDrag = function(event) {
		if(!artefact) return;
		artefact.getAnimation().update(event);
	}

	// Mouse up event
	var _onMouseUp = function(event) {
		if(!artefact) return;
		artefact.getAnimation().start();
		
		var _prev = prevAnimation;
		var _cur = artefact.getAnimation().export();
		prevAnimation = _cur;
		
		var undo = function() {
			if(Object.keys(_prev).length == 0) {
				return artefact.removeAnimation();
			}
			artefact.animate(_prev.type, _prev.properties).start()
		}

		var redo = function() {
			artefact.animate(_cur.type, _cur.properties).start()
		}

		P.history.registerState(undo, redo);
	}

	// Store methods if none exist
	animTool.onMouseDown = animTool.onMouseDown || _onMouseDown;
	animTool.onMouseDrag = animTool.onMouseDrag || _onMouseDrag;
	animTool.onMouseUp = animTool.mouseUp || _onMouseUp;
	
	// Register tool and animation
	newAnimation.tool = animTool;
	P.registerTool(type, animTool);
	P.animations[type] = newAnimation;


	return newAnimation;
};/**
 * An animation for bouncing objects.
 * 
 * @name bounce
 * @memberOf P.animations
 * @type {Object}
 */
(function() {

	/**
	 * Rotation animation
	 *
	 * This object defines the rotation animation.
	 * @type {Object}
	 */
	var bounce = {}

	// Animation iself: frame updates
	bounce.onFrame = function(artefact, props, event) {
		props.position += .01
		var trajectory = props.startPoint.subtract(props.endPoint)
		var relPos = (Math.sin((props.position + .5) * Math.PI) + 1) / 2;
		var newPoint = trajectory.multiply(relPos).add(props.endPoint);
		var delta = newPoint.subtract(artefact.item.position);
		
		// Move it!
		artefact.item.position = artefact.item.position.add(delta)
	}

	// Reset
	bounce.onStop = function(artefact, props) {
		artefact.item.position = props.startPoint.add(props.position)
		props.position = 0;
	}

	// Draws the handles
	bounce.onDrawHandles = function(artefact, props) {
		var line, dot1, dot2, handles;

		line = new paper.Path.Line(props.startPoint, props.endPoint)
		line.strokeColor = P.mainColor;
		line.strokeWidth = 1;
		
		dot1 = new paper.Path.Circle(props.startPoint, 3)
		dot1.fillColor = P.mainColor;

		dot2 = dot1.clone();
		dot2.position = props.endPoint;

		handles = new paper.Group([line, dot1, dot2]);
		return handles;
	}

	bounce.onTransform = function(artefact, props, matrix) {
		props.startPoint = props.startPoint.transform(matrix)
		props.endPoint = props.endPoint.transform(matrix)
	}

	bounce.onClone = function(copy, props) {
		props.startPoint = getCenter(copy);
		return props;
	}

	bounce.onUpdate = function(artefact, props, event) {
		var center = artefact.getShadowBounds().center;
		center = center.transform(artefact.item.matrix);
		props.startPoint = center//artefact.getCenter(false);
		props.endPoint = new paper.Point(event.point);
	}

	// Register the animation
	P.registerAnimation('bounce', bounce, { speed: 2, position: 0 })

})();/**
 * Rotation animation, allows the user to rotate an artefact around
 * a specified point.
 *
 * @name rotate
 * @memberOf P.animations
 * @type {Object}
 */
(function() {
	
	// The animation object
	rotate = {}

	// Animation iself: frame updates
	rotate.onFrame = function(artefact, props, event) {
		artefact.item.rotate(props.speed, props.center);
		props.degree = ((props.degree || 0) + props.speed) % 360
	}

	// Reset
	rotate.onStop = function(artefact, props) {

		// Rotate the item back to its original position
		var deg = - props.degree
		artefact.item.rotate(deg, props.center)
		props.degree = 0;

		// The path might not be exactly rectangular anymore due to the 
		// rotation. Rounding the coordinates solves the problem.
		if(artefact.isRectangle()) {
			artefact.item.segments.map(function(segment) {
				segment.point.x = Math.round(segment.point.x)
				segment.point.y = Math.round(segment.point.y)
			})
		}
	}

	// Draws the handles
	rotate.onDrawHandles = function(artefact, props) {
		var line, dot, handles;

		// Determine the middle of the bounding box: average of two opposite corners
		corners = artefact.bbox.children['border'].segments;
		middle = corners[0].point.add(corners[2].point).divide(2);
		
		line = new paper.Path.Line(middle, props.center)
		line.strokeColor = P.mainColor;
		line.strokeWidth = 1;
		
		dot = new paper.Path.Circle(props.center, 3)
		dot.fillColor = P.mainColor;
		dot.position = props.center;

		handles = new paper.Group([line, dot]);
		return handles;
	}

	// Transform the center point
	rotate.onTransform = function(artefact, props, matrix) {
		props.center = props.center.transform(matrix)
	}

	rotate.onUpdate = function(artefact, props, event) {
		props.center = new paper.Point(event.point);
	}

	// Register!
	P.registerAnimation('rotate', rotate, { speed: 2 })

})();
/**
 * Tool for drawing circles.
 *
 * @name circle
 * @memberOf P.tools
 * @type {paper.Tool}
 */
(function(){
	var circleTool = new paper.Tool()
	var circle, radius, center;

	circleTool.onMouseDown = function(event) {
		P.deselectAll()
		circle = new paper.Path.Circle({
			center: event.point, 
			radius: 0,
			fillColor: P.getActiveSwatch()
		});
	}

	circleTool.onMouseDrag = function(event) {
		var color = circle.fillColor;
		var diff = event.point.subtract(event.downPoint)
		radius = diff.length / 2
		center = diff.divide(2).add(event.downPoint)
		circle.remove();
		circle = new paper.Path.Circle({
			center: center,
			radius: radius,
			opacity: .9,
			fillColor: color
		});
	}

	circleTool.onMouseUp = function(event) {

		// Initialize artefact
		var artefact = new P.Artefact.Circle(center, radius);
		artefact.item.fillColor = circle.fillColor
		circle.remove();
		
		// History
		var undo = function() { artefact.destroy(); }
		var redo = function() { artefact.restore(); }
		P.history.registerState(undo, redo)
	}

	P.registerTool('circle', circleTool);
})();/**
 * Clone tool: clones the selected elements. The tool is activated by the 
 * {@link P.tools.select} tool, when the `alt`-key is pressed down.
 * 
 * @name clone
 * @memberOf P.tools
 * @type {paper.Tool}
 */
(function() {
	var cloneTool = new paper.Tool();

	var currentItems;
	cloneTool.onMouseDown = function(event) {
		currentItems = P.actions.clone(P.getSelected());
	}

	cloneTool.onMouseDrag = function(event) {
		currentItems.mmap('move', [event.delta])
	}

	cloneTool.onMouseUp = function() {}

	P.registerTool('clone', cloneTool);
	
})();/**
 * Tool for dragging artefacts. Activated by {@link P.tools.select} when 
 * the user clicks a selected artefact.
 * 
 * @type {paper.Tool}
 * @name drag
 * @memberOf P.tools
 */
(function() {
	var dragTool = new paper.Tool();

	dragTool.onMouseDrag = function(event, artefacts) {
		artefacts.map(function(artefact) {
			artefact.move(event.delta);
		})
	}

	dragTool.onMouseUp = function(event, artefacts) {

		var undoDelta = new paper.Point(event.downPoint.subtract(event.point))
		var redoDelta = new paper.Point(event.point.subtract(event.downPoint))

		if(redoDelta.length > 1) {
			var artefacts;
			
			var undo = function() {
				artefacts.map(function(artefact) {
					artefact.move(undoDelta);
				})
			}
			
			var redo = function() {
				artefacts.map(function(artefact) {
					artefact.move(redoDelta);
				})
			}
			
			P.history.registerState(undo, redo);
		}
	}

	P.registerTool('drag', dragTool);
})();/**
 * Tool for manipulating artefacts. It is activated by {@link P.tools.select}
 * when the user hit one of the artefacts handles. When the mouse is then 
 * dragged, {@link Artefact.manipulate} is called to perform the actual
 * manipulation.
 *
 * @name manipulate
 * @memberOf P.tools
 * @todo support for history redo/undo
 * @type {paper.Tool}
 */
(function() {
	var manipulateTool = new paper.Tool();

	manipulateTool.onMouseDown = function(event, artefacts, handle) {
	}

	manipulateTool.onMouseDrag = function(event, artefacts, handle) {	
		var artefact = artefacts[0];
		artefact.manipulate(event, handle);
	}

	manipulateTool.onMouseUp = function(event, artefacts, handle) {
	}

	P.registerTool('manipulate', manipulateTool)
})();/**
 * Tool for drawing rectangles. 
 * 
 * @name rectangle
 * @memberOf P.tools
 * @type {paper.Tool}
 */

(function(){
	var rectTool = new paper.Tool();
	var rectangle;

	rectTool.onMouseDown = function(event) {
		rectangle = new paper.Path.Rectangle(event.point, new paper.Size(0,0));
		rectangle.fillColor = P.getActiveSwatch();
	}

	rectTool.onMouseDrag = function(event) {
		color = rectangle.fillColor;
		rectangle.remove();
		rectangle = new paper.Path.Rectangle(event.downPoint, event.point);
		rectangle.fillColor = color;
		rectangle.opacity = .9;
	}

	rectTool.onMouseUp = function() {
		var artefact = new P.Artefact.Rectangle(rectangle)

		// History
		var undo = function() { artefact.destroy(); }
		var redo = function() { artefact.restore(); }
		P.history.registerState(undo, redo)
	}

	P.registerTool('rectangle', rectTool);
})();/**
 * Selection tool. The default and most important tool that selects, drags and 
 * manipulates items. In fact, it only deals with the `mouseDown` part, and 
 * depending on the user action activates {@link P.tools.selection}, 
 * {@link P.tools.drag}, {@link P.tools.manipulate} or {@link P.tools.clone}.
 *
 * @name select
 * @memberOf P.tools
 * @type {paper.Tool}
 */
(function(){
	var selectTool = new paper.Tool()

	function switchTool(newTool, event, artefacts, target) {

		// Update the new tool, this is a bit hacky though.
		newTool._downPoint = event.downPoint;
		newTool._point = event.downPoint;
		newTool._downCount += 1; // Not strictly necessary

		// Store the current artefacts
		newTool._artefacts = artefacts;
		newTool._target = target;

		// Mouse Down
		var _onMouseDown = newTool.onMouseDown || function() {};
		newTool.onMouseDown = function(event) {
			var artifacts = event.tool._artefacts,
					target = event.tool._target;
			return _onMouseDown(event, artifacts, target);
		}

		// Mouse Drag
		var _onMouseDrag = newTool.onMouseDrag || function() {}
		newTool.onMouseDrag = function(event) {
			var artifacts = event.tool._artefacts,
					target = event.tool._target;
			return _onMouseDrag(event, artifacts, target);
		}

		// Reactivate selection tool afterwards!
		var _onMouseUp = newTool.onMouseUp || function() {};
		newTool.onMouseUp = function(event) {
			var artifacts = event.tool._artefacts,
					target = event.tool._target;
			_onMouseUp(event, artifacts, target);
			selectTool.activate()
		}

		// Update the event
		event.tool = newTool;
		
		// Activate!
		newTool.activate()
		if(newTool.onSwitch) {
			newTool.onSwitch(event)
		} else {
			newTool.emit('mousedown', event)
		} 
	}

	selectTool.onMouseDown = function(event) {
		
		// Test if we hit an item
		var hitResult = paper.project.hitTest(event.point, {
			fill: true,
			tolerance: 5
		})

		// We hit noting!
		if(!hitResult) {
			P.deselectAll();
			switchTool(P.tools.selection, event, []);
		}
		
		// We hit a handle --> edit selection
		else if(P.isHandle(hitResult.item)) {
			if(hitResult.item.name.endsWith('animation')) return;
			var artefacts = [P.getArtefact(hitResult.item)]
			switchTool(P.tools.manipulate, event, artefacts, hitResult.item);
		}

		// Hit an item
		else {

			// Note: this also fetches the artefact of a shadow
			var hit = P.getArtefact(hitResult.item);
			var artefacts = P.getSelected();

			if(paper.Key.isDown('shift')) {

				// Already selected: remove from selection
				if(hit.isSelected()) {
					var index = artefacts.indexOf(hit);
					artefacts.splice(index, 1);
				} 

				// Not selected yet: add to selection
				else {
					artefacts.push(hit);	
				}

			}
			
			// If you click outside the selection with no modifiers, select the hit.
			else if(!hit.isSelected()) {
				artefacts = [hit]
			}

			// Update selection
			P.selectOnly(artefacts);

			// Switch
			var newTool = paper.Key.isDown('alt') ? P.tools.clone : P.tools.drag;
			switchTool(newTool, event, artefacts)
		}
	}

	P.registerTool('select', selectTool);
})();/**
 * Selection tool, activated by {@link P.tools.select} when the user did not
 * click on any artefact. The tool draws a dotted, rectangular seletion area
 * and selects all artefacts inside.
 * 
 * @name selection
 * @memberOf P.tools
 * @type {paper.Tool}
 */
(function() {

	var selectionTool = new paper.Tool();

	var selectRect;

	selectionTool.onMouseDown = function(event, artefacts) {
		selectRect = new paper.Path.Rectangle(event.point, new paper.Size(0,0));
	}

	selectionTool.onMouseDrag = function(event, artefacts) {
		if(selectRect)
			selectRect.remove();
		selectRect = new paper.Path.Rectangle(event.downPoint, event.point);
		selectRect.strokeColor = "#333"
		selectRect.dashArray = [2,3]
		selectRect.strokeWidth = 1
	}

	selectionTool.onMouseUp = function(event, artefacts) {
		// Remove the selection region
		if(selectRect) selectRect.remove();

		// Find all items in the selection area
		rect = new paper.Rectangle(event.downPoint, event.point)
		var items = paper.project.activeLayer.getItems({ 
			overlapping: rect,
			match: function(item) {
				return item.data._artefact != undefined
			}
		});

		// If we put this in the match, it doesn't work?
		// Reimplement?
		items = items.filter(function(item) { 

			var isBBox = item.name == 'bbox';
			var inGroup = (item.parent.className == 'Group' 
				|| item.data._artefact.item.parent.className == 'Group');
			var isGroup = item.data._artefact.className == 'Group';
			
			// Cannot select anything in a group
			if(inGroup) return false;

			// Otherwise, only select BBox if it is a group.
			return !isBBox || (isBBox && isGroup);
		})

		var artefacts = items.map(P.getArtefact);
		P.select(artefacts);
	}

	P.registerTool('selection', selectionTool);

})();