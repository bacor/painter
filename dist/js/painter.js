/**
 * Painter.js
 */

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */
var P = {

	mainColor: '#78C3D0',

	/**
	 * Select an item or multiple items.
	 *
	 * The item is not selected using the Paper.js's default `item.selected = true`. 
	 * Rather, we draw a custom bounding box around the item, allowing a bit
	 * more flexibility (e.g. different bounding boxes for different types of
	 * items). To test if an item has been selected using our custom selection
	 * method, the test function `isSelected` can be used.
	 * @param  {mixed} items An item or multiple items
	 * @return {None}
	 */
	select: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.select);
		return artefact.select();
	},

	/**
	 * Deselect an item
	 *
	 * This removes the bounding box and resets styling specific to selected
	 * items.
	 * @param  {item} item 
	 * @return {None}
	 */
	deselect: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.deselect);
		return artefact.deselect();
	},

	/**
	 * Deselects all the currently selected items.
	 *
	 * Again, we don't use the in-built selection mechanism, but rely on our own
	 * bounding boxes. Only items with bounding boxes are deselected, the function
	 * does not care about the value of `item.selected`.
	 * @param  {array} items 
	 * @return {None}
	 */
	deselectAll: function() {
		return P.getArtefacts().mmap('deselect');
	},

	/**
	 * Selects only this item
	 * @param  {item} item The only item to select
	 * @return {None}
	 */
	selectOnly: function(artefacts) {
		P.deselectAll();
		return P.select(artefacts);
	},

	getArtefacts: function() {
		return Object.values(P.artefacts);
	},

	/**
	 * Return all selected items
	 * @param  {Function} match The match function, defaults to isSelected
	 * @return {Array}       Selected items
	 */
	getSelected: function() {
		return P.getArtefacts().filter(function(artefact) {
			return artefact.isSelected();
		})
	},

	/*****************************************************/

	/**
	 * Test if the item is a handle of a bounding box.
	 * @param  {Item}  item 
	 * @return {Boolean}
	 */
	isHandle: function(item) {
		if(!item.name) return false;
		return item.name.startsWith('handle');
	},

	/**
	 * Test if an item is in a group
	 * @param  {Item} 		item 
	 * @return {Boolean}
	 */
	inGroup: function(item) {
		if(item.parent) return item.parent.className == 'Group';
		return false;
	},

	isArtefact: function(obj, strict=false) {
		if(obj instanceof P.Artefact) return true;
		if(!strict && obj.data && obj.data._artefact) 
			return P.isArtefact(obj.data._artefact);
		return false;
	},

	/*****************************************************/

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
	 * Find the higest group in which the item is contained
	 * @param  {Item} 	item 
	 * @return {Group}  The outermost group containing `item`
	 */
	getOuterGroup: function(item) {
		if(P.inGroup(item.parent)) return P.getOuterGroup(item.parent);
		return item.parent
	},

	/*****************************************************/

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

	getActiveSwatch: function() {
		var index = $('.swatch.active').data('colorIndex');
		var numSwatches = $('.swatch.active').data('numSwatches');
		return P.getColor(index, numSwatches)
	},

};


// Method Map
Array.prototype.mmap = function(name, args) {
	return this.map(function(element) {
		return element[name].apply(element, args);
	});
}
;/**
 * History
 *
 * Registers actions and implements undo/redo functionality. Actions 
 * are registered by providing two functions, `undo` and `redo`, that
 * take no other arguments (i.e., they are thunks). When registering 
 * these functions, care has to be taken that the right variables are
 * copied and scoped appropriately so that later actions do not change
 * the references in the `un/redo` functions. 
 *
 * Actions for animations are a bit tricky, as one has to track the
 * complete `item.animation` object. All this is solved in animations.js.
 */
P._HistoryClass = paper.Base.extend({

	initialize: function() {
		this.states = [{}];
		this.index = 0;
		this.maxStates = 20;
	},

	/**
	 * Register a state to the history
	 * 
	 * @param  {Function} undo An function that when called undoes the
	 * action. The function should take no arguments and take care of
	 * scoping and copying relevant variables itself.
	 * @param  {Function} redo A redo function that when called redoes
	 * the action undone by `undo`. Again, it takes no arguments.
	 * @return {None}
	 */
	registerState: function(undo, redo) {
		this.states = this.states.slice(0, this.index+1);
		this.states.push({redo: redo, undo: undo });
		this.index += 1;

		if(this.states.length > this.maxStates) {
			this.states = states.slice(this.states.length - this.maxStates);
			this.index = this.states.length - 1;
		}
	},

	/**
	 * Redo the last action
	 *
	 * Moves the index one step forward in the history, if possible.
	 * @return 
	 */
	redo: function() {
		if(this.index >= this.states.length-1) return false;
		this.index += 1;
		this.states[this.index].redo();
	},

	/**
	 * Undo the last action
	 * @return {None} 
	 */
	undo: function() {
		if(this.index == 0) return false;
		this.states[this.index].undo();
		this.index -= 1;
	}
})

// Instantiate
P.History = new P._HistoryClass();
;
P.artefacts = {}

P.Artefact = paper.Base.extend({
	_class: 'Artefact',

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
	 * Show the bounding box of the current item
	 * @return {Item|Boolean} The current item or false if it is not an Artefact
	 */
	showBoundingBox: function() {
		if(!this.bbox) this.drawBoundingBox();
		this.bbox.visible = true;
		return this;
	},

	/**
	 * Hide the bounding box
	 * @return {Item}
	 */
	hideBoundingBox: function() {
		if(this.bbox) this.bbox.visible = false;
		return this;
	},

	removeBoundingBox: function() {
		this.hideBoundingBox();
		if(this.bbox) this.bbox.remove();
		this.bbox = undefined;
		return this;
	},

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
	 * Test if this is selected
	 * @return {Boolean} True if this item is selected
	 */
	isSelected: function() {
		return this.selected == true;
	},

	/**
	 * Select the current item
	 * 
	 * @return {Item} The current item
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
	 * Deselect this item
	 *
	 * Removes the bounding box and animation handles if they exist.
	 * @return {Item} The current item
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
	 * Animate the item.
	 * 
	 * @param  {String} type       The type of animation, e.g. 'bounce' or 'rotate'.
	 * @param  {Object} properties Properties for this animation. The shape of this object
	 * differs across types of animations. 
	 * @return {Animation}         The animation object
	 */
	animate: function(type, properties) {
		if(this.hasAnimation()) {
			this.animation.remove();
		}

		var anim = new P.Animation(this, type, properties);
		this.anim = anim;
		return this.anim;
	},

	/**
	 * Get the animation object 
	 * 
	 * @return {Animation|Boolean} The animation object, an instance of {@link Animation}
	 * or `false` if no animation exists.
	 */
	getAnimation: function() {
		return this.anim;
		// return this.animation;
	},

	hasAnimation: function(type=false) {
		if(!this.getAnimation()) return false;
		if(type) return this.getAnimation().type == type;
		return true;
	},

	isAnimating: function() {
		return this.hasAnimation() ? this.getAnimation().isActive() : false;
	},

	getShadowBounds: function(transform=false) {
		return this.shadow ? this.shadow.bounds : false;
	},

	transform: function(matrix) {
		this.item.transform(matrix);
		if(this.bbox) this.bbox.transform(matrix);
		if(this.hasAnimation()) this.getAnimation().transform(matrix);
	},

	/**
	 * Move the item by a specified distance.
	 *
	 * Repositioning the item directly gives undesired results, since the item
	 * has a bounding box and possibly animation handles that also need to be 
	 * repositioned. That is what this function takes care of.
	 *
	 * @todo Use a general transform function instead?
	 * 
	 * @param  {paper.Point} delta The distance by which the item should be moved.
	 * @return {Item} The current item
	 */
	move: function(delta) {
		var matrix = new Matrix().translate(delta);
		this.transform(matrix);
		return this;
	},

	destroy: function() {
		this.deselect();
		if(this.bbox) {
			this.bbox.remove();
			delete this.bbox;
		}
		if(this.hasAnimation()) {
			this.getAnimation().remove();
			delete this.getAnimation();
		}

		// Remove the item the very end!
		this.item.remove();
		delete P.artefacts[this.id];
	},

	restore: function() {
		project.activeLayer.addChild(this.item);
		if(this.hasAnimation()) this.getAnimation().start;
		P.artefacts[this.id] = this;
		return this;
	},

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

		console.log('copy', copy)
		return copy;
	},

	isRectangle: function() {
		return this instanceof P.Artefact.Rectangle;
	},

	isCircle: function() {
		return this instanceof P.Artefact.Circle;
	}

})

P.Artefact.Rectangle = P.Artefact.extend({
	_class: 'Rectangle',

	initialize: function(args) {
		var item;
		if(args instanceof paper.Item) {
			item = args;
		} else{
			item = new paper.Path.Rectangle(args);
		}
		P.Artefact.apply(this, [item]);
	},

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

	manipulate: function(event, handle) {
		if(this.isAnimating()) return false;

		var index, segments, adjacents, sameX, sameY, newWidth, newHeight, deltaX, deltaY;

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

		// Color selected handle
		// Todo: doesn't work when flipping a rectangle, but at least the code is
		// simple and readable again.
		var newHandle = this.bbox.children[handle.name];
		newHandle.fillColor = P.mainColor;
	},


	/**
	* Get the adjacent segments of a given segment on a rectangle
	*
	* @param  {Segment} segment 
	* @return {object}         An object `{ sameX: sameXSegment, sameY: sameYSegment }`.
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

P.Artefact.Circle = P.Artefact.extend({
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
		var center = item.position,
					radius = item.bounds.width,
					newRadius = event.point.subtract(center).length * 2 - 6,
					scaleFactor = newRadius/radius;
			item.scale(scaleFactor);
			this.drawBoundingBox();

			// Color the selected handle
			var newHandle = this.bbox.children[1];
			newHandle.fillColor = P.mainColor;
	}

})

P.Artefact.Group = P.Artefact.extend({
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

	clone: function clone() {
		this.deselect();
		var clonedChildren = this.children.mmap('clone').mmap('deselect')
		var	copy = new P.Artefact.Group(clonedChildren);
		clone.base.call(this, copy);
		copy.item.transform(this.item.matrix)
		return copy
	},

	getShadowBounds: function(depth=1) {
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

	manipulate: function(event, handle) {
		if(this.isAnimating()) return false;
		
		var bounds = this.item.bounds,
				center = this.item.position,
				width = bounds.width,
				height = bounds.height,
				diag = Math.sqrt(width*width + height*height),
				newDiag = event.point.subtract(center).length * 2 - 6,
				scaleFactor = newDiag/diag;

		this.item.scale(scaleFactor);

		// Update the selection box
		this.drawBoundingBox();

		// Color selected handle
		if(this.bbox.children[handle.name])
			this.bbox.children[handle.name].fillColor = P.mainColor;
	},

	ungroup: function() {
		// Reinstert parent items
		var childItems = this.children.map(function(child){ return child.item });
		var parent = this.item.parent ? this.item.parent : project.activeLayer;
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

	destroy: function destroy(destroyChildren=false) {
		if(destroyChildren) this.children.mmap('destroy');
		return destroy.base.call(this);
	}
});
P.deleteSelection = function(artefacts) {
	var artefacts = artefacts || P.getSelected();

	var undo = function() {
		artefacts.mmap('restore').mmap('select');
	}

	var redo = function() {
		artefacts.mmap('destroy');
	}
	
	P.History.registerState(undo, redo);

	redo();
}

P.group = function(items) {

	var undo = function() {
		// To do: this breaks up the history chain since we no 
		// longer refer to the same group...
		artefact.ungroup().mmap('select');
	}

	var redo = function() {
		return artefact = new P.Artefact.Group(items).select();
	}

	P.History.registerState(undo, redo)		

	// Perform the action
	return redo();
}

/**
 * See https://github.com/paperjs/paper.js/issues/1026
 * @param  {Group} group 
 * @return {Array}       Children
 */
P.ungroup = function(theGroup) {
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

	P.History.registerState(undo, redo);
	
	// Perform the action
	return redo();
}

P.cloneSelection = function(move=[0,0]) {
	var artefacts = P.getSelected();
	var clones = artefacts.mmap('clone').mmap('move', [move]);
	P.selectOnly(clones);

	var undo = function() {
		clones.mmap('destroy');
	}
	var redo = function() {
		clones.mmap('restore').mmap('select');
	}
	P.History.registerState(undo, redo)

	return clones;
}


P.changeColorSelection = function() {
	var swatch = P.getActiveSwatch(),
			artefacts = P.getSelected(),
			origColors;
	
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
	
	P.History.registerState(undo, redo);

	redo();
};/**
 * All registered animations
 * @type {Object}
 */
P.animations = {}

/**
 * @name Animation
 * @class
 */
P.Animation = paper.Base.extend(/** @lends Animation */{

	/**
	 * The type of this animation, e.g. rotate or 'bounce'
	 * @type {String}
	 */
	type: '',

	/**
	 * The Paper item being animated
	 * @type {paper.Item}
	 */
	item: undefined,

	/**
	 * The properties determining the animation
	 * @type {Object}
	 */
	properties: {},

	/**
	 * Initialize an animation.
	 *
	 * @name  Animation
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
		// // if(!item.animation._prevAnimation) item.animation._prevAnimation = {};

		// // Load all animation-specific methods.
		var methods = ['onInit', 'onStart', 'onPause', 'onStop', 'onFrame', 
		'onTransform', 'onDrawHandles', 'onUpdate'];
		for(var i=0; i<methods.length; i++) {
			var method = methods[i];
			this['_'+method] = P.animations[this.type][method] || function() {};
		}
		this._onInit(this.artefact, this.properties);
		this.drawHandles();
	},

	/**
	 * Draw the animation handles
	 * 
	 * @return {Animation}
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
	 */
	start: function(recurse=true) {
		// if(isGroup(item) && recurse) 
		// 	startAnimation(item.children, type, false);
		
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
	 * @return {Animation}
	 */
	pause: function() {
		this.active = false;
		this.item.onFrame = undefined;
		this._onPause(this.artefact, this.properties);
		return this;
	},

	/**
	 * Stops the animation: pause the animation and reset the item to its original state.
	 * @param  {Boolean} recurse Good question...
	 * @return {Animation}
	 */
	stop: function(recurse=false) {
		// if(isGroup(item) && recurse) resetAnimation(item.children, true);

		// Stop animation
		this.pause();
		this._onStop(this.artefact, this.properties);
		return this;
	},

	/**
	 * Remove the animation. It does not actually remove the animation object,
	 * but resets the animation and removes all items drawn on the canvas, such
	 * as handles.
	 * @return {Animation}
	 */
	remove: function() {
		this.stop();
		this.removeHandles();
	},

	/**
	 * Apply a transformation to the animation
	 * @param  {paper.Matrix} matrix The transformation matrix
	 * @return {Animation}        [description]
	 */
	transform: function(matrix) {
		this._onTransform(this.artefact, this.properties, matrix);
		return this;
	},

	/**
	 * Test if this animation is active: if the animation is currently running.
	 * If the animation is paused or stopped, `isActive` returns `false`.
	 * @return {Boolean}
	 */
	isActive: function() {
		return this.active == true;
	},

	cloneProperties: function() {
		return jQuery.extend(true, {}, this.properties);
	}
	// clone: function(artefact) {
	// 	var artefact = artefact || this.artefact;
	// 	var properties = jQuery.extend(true, {}, this.properties);
	// 	var type = '' + this.type;
	// 	var copy = new P.Animation(artefact, type, properties);
	// 	return copy
	// }
})

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
 * 		based on a mouse event. This function is called whenever the animation 
 * 		tool is active and the mouse moves. The properties determined here are
 * 		passed to all functions below.
 * - `onFrame(item, properties, events)` updates the object based on the properties,
 * 		event etc. This is the core of the animation
 * - `drawHandles(item, properties)` returns a `Group` with the handles
 * - `onTransform(item, properties, matrix)` handles a transform of the item.
 * 		The properties probably contain some point in a relative coordinate system.
 * 		This function should apply the matrix to that point.
 * - `onStop(item, properties)` Should undo the animation and reset the item.
 * 
 * @param  {String} type              Name of the animation
 * @param  {Object} animation         Animation object
 * @param  {Object} defaultProperties Default properties
 * @return {Object} The animation                   
 */
P.registerAnimation = function(type, newAnimation, defaultProperties) {
	
	// Set up the animation tool
	if(!newAnimation.tool) newAnimation.tool = new paper.Tool();

	// The current item on which the tool works.
	var artefact;

	// On Mouse Down
	var _onMouseDown = function(event) {
		artefact = P.getSelected()[0]
		if(artefact == undefined) {
			hitResult = project.hitTest(event.point, {
				fill: true, 
				tolerance: 5,
			})
			if(!hitResult) return false;
			artefact = P.getArtefact(hitResult.item)
		}
		P.selectOnly(artefact);
		
		// Animate.
		artefact.animate(type, defaultProperties);
		
		// if(!item.animation) item.animation = {};
		// if(!item.animation._prevAnimation) item.animation._prevAnimation = {};
		
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
		
		// var item = currentItem;
		// var prevAnimation = jQuery.extend(true, {}, item.animation._prevAnimation);
		// var curAnimation = jQuery.extend(true, {}, item.animation);
		// item.animation._prevAnimation = curAnimation;

		// var undo = function() {
		// 	resetAnimation(item);

		// if(Object.keys(prevAnimation).length == 0) {
		// item.animation._prevAnimation = {}
		// item.animation = {}
		// } else {
		// item.animation = prevAnimation
		// updateAnimation(item, prevAnimation.properties)
		// startAnimation(item)
		// }
		// }

		// var redo = function() {
		// 	resetAnimation(item)
		// 	item.animation = curAnimation
		// 	updateAnimation(item, curAnimation.properties)
		// 	startAnimation(item)
		// 	select(item)
		// }

		// P.History.registerState(undo, redo);
	}

	// Store methods if none exist
	newAnimation.tool.onMouseDown = newAnimation.tool.onMouseDown || _onMouseDown;
	newAnimation.tool.onMouseDrag = newAnimation.tool.onMouseDrag || _onMouseDrag;
	newAnimation.tool.onMouseUp = newAnimation.tool.mouseUp || _onMouseUp;

	// Store!
	P.animations[type] = newAnimation;

	return newAnimation;
};/**
 * Register the bounce animation
 * @return {null}
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
		props.endPoint = new Point(event.point);
	}

	// Register the animation
	P.registerAnimation('bounce', bounce, { speed: 2, position: 0 })

})();
/**
 * Circle tool
 *
 * Draws circles.
 */

circleTool = new paper.Tool()
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
	circle = new Path.Circle({
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
	P.History.registerState(undo, redo)
};
cloneTool = new paper.Tool();

var currentItems;
cloneTool.onMouseDown = function(event) {
	currentItems = P.getSelected();
	currentItems = cloneSelection();
}

cloneTool.onMouseDrag = function(event) {
	currentItems.mmap('move', [event.delta])
}

cloneTool.onMouseUp = function() {};dragTool = new paper.Tool();

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
		
		P.History.registerState(undo, redo);
	}
};/**
 * @todo support for history redo/undo
 * @type {paper.Tool}
 */
manipulateTool = new paper.Tool();

manipulateTool.onMouseDown = function(event, artefacts, handle) {
}

manipulateTool.onMouseDrag = function(event, artefacts, handle) {	
	var artefact = artefacts[0];
	artefact.manipulate(event, handle);
}

manipulateTool.onMouseUp = function(event, artefacts, handle) {

};/**
 * Rectangle tool
 * 
 * Draws rectangles
 */


rectTool = new paper.Tool();
var rectangle;

rectTool.onMouseDown = function(event) {
	rectangle = new Path.Rectangle(event.point, new Size(0,0));
	rectangle.fillColor = P.getActiveSwatch();
}

rectTool.onMouseDrag = function(event) {
	color = rectangle.fillColor;
	rectangle.remove();
	rectangle = new Path.Rectangle(event.downPoint, event.point);
	rectangle.fillColor = color;
	rectangle.opacity = .9;
}

rectTool.onMouseUp = function() {
	var artefact = new P.Artefact.Rectangle(rectangle)

	// History
	var undo = function() { artefact.destroy(); }
	var redo = function() { artefact.restore(); }
	P.History.registerState(undo, redo)
};/**
 * Register the rotate animation 
 *
 * @return {null}
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
		props.center = new Point(event.point);
	}

	// Register!
	P.registerAnimation('rotate', rotate, { speed: 2 })

})();
/**
 * Selection tool
 *
 * The default and most important tool that selects, drags and edits items.
 * Depending on where the user clicks, the selection tool enters a different
 * *mode* (one of `selecting, editing, dragging`). The behaviour is determined
 * largely through the mode the selector is in.
 */

selectTool = new paper.Tool()

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
	var hitResult = project.hitTest(event.point, {
		fill: true,
		tolerance: 5
	})

	// We hit noting!
	if(!hitResult) {
		P.deselectAll();
		switchTool(selectionTool, event, []);
	}
	
	// We hit a handle --> edit selection
	else if(P.isHandle(hitResult.item)) {
		if(hitResult.item.name.endsWith('animation')) return;
		var artefacts = [P.getArtefact(hitResult.item)]
		switchTool(manipulateTool, event, artefacts, hitResult.item);
	}

	// Hit an item
	else {

		// Note: this also fetches the artefact of a shadow
		var hit = P.getArtefact(hitResult.item);
		var artefacts = P.getSelected();

		if(Key.isDown('shift')) {

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
		var newTool = Key.isDown('alt') ? cloneTool : dragTool;
		switchTool(newTool, event, artefacts)
	}
};
selectionTool = new paper.Tool();

var selectRect;

selectionTool.onMouseDown = function(event, artefacts) {
	selectRect = new paper.Path.Rectangle(event.point, new Size(0,0));
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
	var items = project.activeLayer.getItems({ 
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
};/**
 * Painter.js
 */

paper.install(window);

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */


$(window).ready(function() {

	paper.setup('canvas');

	// Hmmmm....
	bounceTool = P.animations.bounce.tool
	rotationTool = P.animations.rotate.tool
	
	function onKeyDown(event) {

		if(event.key == 'backspace' || event.key == 'd') {
			P.deleteSelection()
		}

		else if(event.key == 'space') {
			$('a.tool[data-tool=playpause]').click();
		}

		else if(event.key == 'z') {
			if(Key.isDown('control')) {
				P.History.undo()
			}
			else {
				$('a.tool[data-tool=reset]').click();
			}
		}

		else if(event.key =='y' && Key.isDown('control')) {
			P.History.redo()
		}

		else if(event.key =='g') {
			P.group(P.getSelected())
		}

		else if(event.key =='u') {
			P.ungroup(P.getSelected())
		}

		else if(event.key == 'r') {
			$('a.tool[data-tool=rotate]').click();
		}

		else if(event.key == 'v') {
			$('a.tool[data-tool=select]').click();
		}

		else if(event.key == 'c') {
			$('a.tool[data-tool=circle]').click();
		}

		else if(event.key == 's') {
			$('a.tool[data-tool=rectangle]').click();
		}

		else if(event.key == 'b') {
			$('a.tool[data-tool=bounce]').click();	
		}

		else if(!isNaN(parseInt(event.key))) {
			var key = parseInt(event.key);
			$('.swatch').each(function(i, el){
				var index = $(el).data('colorIndex')
				if(index+1 == key) $(el).click();
			})
		}
	}

	rectTool.onKeyDown = onKeyDown;
	circleTool.onKeyDown = onKeyDown;
	selectTool.onKeyDown = onKeyDown;
	rotationTool.onKeyDown = onKeyDown;
	bounceTool.onKeyDown = onKeyDown;

	r = new P.Artefact.Rectangle([20,30,100,140])
	r.item.fillColor = P.getColor(0, 7);
	r.select()

	s = new P.Artefact.Rectangle([200,30,100,140])
	s.item.fillColor = P.getColor(2, 7);

	c = new P.Artefact.Circle([300,300], 40)
	c.item.fillColor = P.getColor(1, 7);

	// var anim = r.animate('bounce', { speed: 2, position: 0 });
	// // console.log(r, anim)
	// anim.update({ startPoint: new Point([0,0]), endPoint: new Point([200,200])})
	// r.getAnimation().start()
	// console.log(r)
	// // Demo
	// r = new Path.Rectangle([20,30,100,140])
	// r.fillColor = getColor(0, 7)
	// // r.selected = true
	// r.type = 'rectangle'
	// setupRectangle(r)
	// setupItem(r)

	// c = new Path.Circle([300,100], 40)
	// c.fillColor = getColor(1, 7)
	// // c.selected = true
	// c.type = 'circle'
	// setupItem(c)
	// select(c)
	// select(r)
	// group(P.getSelected())
	// deselectAll()


		// Demo
// 	r = new Path.Rectangle([200,200,100,140])
// 	r.fillColor = getColor(3, 7)
// 	// r.selected = true
// 	r.type = 'rectangle'
// 	setupItem(r)
// setupRectangle(r)
// 	c = new Path.Circle([500,300], 40)
// 	c.fillColor = getColor(4, 7)
// 	// c.selected = true
// 	c.type = 'circle'
// 	setupItem(c)
// 	// select(c)
// 	select(r)

	// rotate(c, new Point([100,100]))
	// rotate()


	$('a.tool[data-tool=rectangle]').on('click', function() {
		rectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=circle]').on('click', function() {
		circleTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=select]').on('click', function() {
		selectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=group]').on('click', function() {
		P.group(P.getSelected())
	})

	$('a.tool[data-tool=ungroup]').on('click', function() {
		P.ungroup(P.getSelected())
	})

	$('a.tool[data-tool=delete]').on('click', function() {
		P.deleteSelection()
	})

	$('a.tool[data-tool=clone]').on('click', function() {
		P.cloneSelection([20,20])
	})

	$('a.tool[data-tool=playpause]').on('click', function() {
		if($(this).data('state') == 'play') {
			P.getSelected().map(function(artefact){
				if(artefact.hasAnimation()) artefact.animation.start();
			});
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')

		} else {
			P.getSelected().map(function(artefact){
				if(artefact.hasAnimation()) artefact.animation.pause();
			});
			$(this).find('span').html('play <code>space</code>')
			$(this).data('state', 'play')
		}
	})

	$('a.tool[data-tool=rotate]').on('click', function() {
		rotationTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=bounce]').on('click', function() {
		bounceTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})//.click()

	$('a.tool[data-tool=reset]').on('click', function() {
		P.getSelected().map(function(artefact) { 
			if(artefact.hasAnimation()) artefact.animation.stop() 
		})
	})

	// Add all swatches
	var $swatches = $('.swatches'),
			numSwatches = parseInt($swatches.data('num-swatches'));
	for(var i=0; i<numSwatches; i++) {

		// Get color without noise
		var color = P.getColor(i, numSwatches, 0);

		// Add swatch handle
		var $swatch = $('<a class="swatch">' + (i+1) + '</a>')
					.css('backgroundColor', color)
					.data('colorIndex', i)
					.data('numSwatches', numSwatches)
					.appendTo($swatches)
					.on('click', function() {
						$('.swatch').removeClass('active');
						$(this).addClass('active');
						P.changeColorSelection();
					})
		if(i == 0) $swatch.addClass('active');
	}



})