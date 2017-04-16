/**
 * Painter.js
 */

// Probably want to get rid of this and use 
// the paper namespace everywhere
paper.install(window);

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */
var P = {};

// var PainterRectangle = function(args) {
// // if(!(this instanceof PainterRectangle)) return new PainterRectangle(arguments);
// 	console.log('asdfasdfs', args)
// 	var rectangle = new Path.Rectangle([20,30,100,140]);

// 	return rectangle
// }
// 


paper.Item.inject({
	
	/**
	 * Show the bounding box of the current item
	 * @return {Item|Boolean} The current item or false if it is not an Artefact
	 */
	showBoundingBox: function() {
		if(!this.isArtefact()) return false;
		if(this.bbox) {
			this.bbox.visible = true;
		} else {
			this.bbox = getBoundingBox(this);
			this.bbox.item = this;
			this.insertBelow(this.bbox);
		}
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
	},

	/**
	 * (Re)draws the bounding box
	 * @return {Item}
	 */
	redrawBoundingBox: function() {
		if(this.bbox) this.bbox.remove();
		this.bbox = undefined;
		return this.showBoundingBox();
	},

	/**
	 * Test if this is a bounding box
	 * @return {Boolean} True if this item is a bounding box
	 */
	isBoundingBox: function() {
		return this.type == 'boundingBox';
	},

	/**
	 * Test if this is an artefact
	 * @return {Boolean} True if this item is an artefact
	 */
	isArtefact: function() {
		return this._artefact === true;
	},

	/**
	 * Test if this is selected
	 * @return {Boolean} True if this item is selected
	 */
	isSelected: function() {
		return this.bbox != undefined && this.bbox.visible == true;
	},

	/**
	 * Select the current item
	 * 
	 * @return {Item} The current item
	 */
	select: function() {
		if(this.isSelected()) return true;
		this.showBoundingBox();
		if(this.hasAnimation()) 
			this.getAnimation().drawHandles();
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
		this.strokeColor = undefined;
		this.dashArray = undefined;
		if(this.hasAnimation())
			this.getAnimation().removeHandles();
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
			var anim = this.getAnimation();
			anim.remove();
			delete anim
		}

		this.data.animation = new P.Animation(this, type, properties);
		return this.getAnimation();
	},

	/**
	 * Get the animation object 
	 * 
	 * @return {Animation|Boolean} The animation object, an instance of {@link Animation}
	 * or `false` if no animation exists.
	 */
	getAnimation: function() {
		return this.data.animation ? this.data.animation : false;
	},

	hasAnimation: function(type=false) {
		var anim = this.getAnimation();
		if(!anim) return false;
		if(anim.type == undefined) return false; // remove?
		if(type) return anim.type == type;
		return true;
	},

	isAnimating: function() {
		return this.hasAnimation() ? this.getAnimation().isActive() : false;
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

		// Move the item
		this.position = this.position.add(delta);

		// Bounding box, only if it exists
		if(this.bbox) this.bbox.position = this.bbox.position.add(delta);

		// if(isGroup(this)) {
		// 	this.children.map(function(item){ 
		// 		item.redrawBoundingBox(); 
		// 		item.hideBoundingBox();
		// 	});
		// }
		
		// Move the animation. We just apply a specific type of transformation:
		// a translation. The rest should be handled by the animation.
		if(this.hasAnimation()) {
			var matrix = new Matrix().translate(delta);
			this.getAnimation().transform(matrix);

			// Todo: history
			// if(item.animation && item.animation._prevAnimation) {
			// 	item.animation._prevAnimation = jQuery.extend(true, {}, item.animation);
			// }
		}



		return this;
	},

	getShadowBounds: function() {
		if(!isGroup(this)) {
			return this.bbox ? this.bbox.children['shadow'].bounds : false;
		}

		// For groups we combine all shadow bounds. In that case, the bound
		// does not change when children are animated.
		var bounds;
		for(var i=0; i<this.children.length;i++){
			var child = this.children[i];
			if(child.isArtefact()) {
				var childBounds = child.getShadowBounds();

				// Transform the child bounds by the groups transformation matrix
				var topLeft = childBounds.topLeft.transform(this.matrix);
				var bottomRight = childBounds.bottomRight.transform(this.matrix);
				childBounds = new Rectangle(topLeft, bottomRight);

				// Extend the bounds by the child's bounds
				bounds = bounds ? bounds.unite(childBounds) : childBounds;
			}
		}
		return bounds
	},

	getShadow: function() {
		return this.bbox.children['shadow'];
	},

	transformAll: function(matrix) {
		this.transform(matrix);
		if(this.bbox) this.bbox.transform(matrix);
		if(this.hasAnimation()) this.getAnimation().transform(matrix);
	}

});
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
 *
 * This object is defined in Module style, see
 * https://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
 */
P.History = (function() {
	
	var states = [{}],
			
			/**
			 * Index of the current state
			 * @type {Number}
			 */
			index = 0,
			
			/**
			 * The maximum number of states stored.
			 * @type {Number}
			 */
			maxStates = 20;

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
	var registerState = function(undo, redo) {
		states = states.slice(0, index+1);
		states.push({redo: redo, undo: undo });
		index += 1;

		if(states.length > maxStates) {
			states = states.slice(states.length - maxStates);
			index = states.length - 1;
		}
	}

	/**
	 * Redo the last action
	 *
	 * Moves the index one step forward in the history, if possible.
	 * @return 
	 */
	var redo = function() {
		if(index >= states.length-1) return false;
		index += 1;
		states[index].redo();
	}

	/**
	 * Undo the last action
	 * @return {None} 
	 */
	var undo = function() {
		if(index == 0) return false;
		states[index].undo();
		index -= 1;
	}

	/**
	 * Reveal to P.History
	 */
	return {
		registerState: registerState,
		undo: undo,
		redo: redo,
		states: states
	};

})();
;;
/**
 * helpers.js
 *
 * This file contains various helpers
 */

function setupRectangle(item) {}

function setupItem(item) {
	item.animation = undefined;
	item._artefact = true;
}

/********************************************************/

/**
 * Generate a handle object
 * @param  {Point} position The position for the handle
 * @return {Path}
 */
function getHandle(position) { 
	var handle = new Path.Circle({
		center: position, 
		radius: 4,
		strokeColor: mainColor,
		fillColor: 'white'
	})

	handle.on('mouseenter', function() {
		this.fillColor = mainColor
	})

	handle.on('mouseleave', function() {
		this.fillColor = 'white'
	})

	handle.type = 'handle'

	return handle
}

/**
 * Generate a bounding box around an item
 *
 * The item can be a circular/rectangular path, a group or a Rectangle.
 * The function draws a bounding box around the item, with some handles. 
 * Depending on the type of item, the bounding box is different: circles
 * have a circular bounding box, all other items a rectangular one. The 
 * handles are also different in both cases.	
 * @param  {mixed} item 
 * @return {Group}
 */
function getBoundingBox(item) {
	var parts = [], shadow;

	// Rectangles, groups or an array of multiple items 
	// all get a rectangular bounding box
	if(!isCircular(item)) {

		// The item's shadow
		if(isGroup(item)) var bounds = item.getShadowBounds();
		shadow = isGroup(item) ? new Path.Rectangle(bounds) : item.clone();

		// The border of the bounding box (expanded slightly)
		var border = new Path.Rectangle(shadow.bounds.expand(12))
		border.strokeColor = mainColor
		border.selectable = false;
		if(isGroup(item)) border.dashArray = [5,2];
		parts.push(border)

		// Add the handles. Order should be the same as in the item.
		var segments = shadow.segments
		for(var i=0; i<segments.length; i++) {
			var positionName = getPositionName(segments[i])
					position = border.bounds[positionName],
					handle = getHandle(position);
			handle.selectable = true;
			handle.type = 'handle:' + positionName
			parts.push(handle)
		}
	}

	// Circles get a circular bounding box
	if(isCircular(item)) {
		shadow = item.clone();
		var radius = (item.bounds.width + 12) / 2
		console.log(item)
		var center = item.position 
		var border = new Path.Circle(item.position, radius)
		border.strokeColor = mainColor
		border.selectable = false;

		var handle = getHandle([center.x + radius, center.y])
		handle.selectable = true;
		parts.push(border,handle);
	}

	// Style shadow
	shadow.fillColor = mainColor;
	shadow.opacity = 0.1;
	shadow.selectable = false;
	shadow.sendToBack();
	shadow.type = 'shadow'
	shadow.name = 'shadow'
	parts.push(shadow)

	// Build the bounding box!
	var bbox = new Group(parts);
	bbox.parent = item.parent;
	bbox.pivot = shadow.bounds.center//[0,0];
	group.transformContent = false;
	bbox.type = 'boundingBox';
	return bbox;
}

// function getShadowBounds(item){
// 	if(!item.bbox) return false;
// 	return item.bbox.children['shadow'].bounds
// }

/**
 * Returns the proper bounds of elements, ignoring animations
 *
 * When an item is animated, the bounds typically change. We typically
 * don't care about that, and want to know the bounds before animation.
 * The bounding box contains a so called *shadow* element that has the
 * right size. This function returns that size or --- in the case of 
 * groups --- combines the shadow sizes of all children. This yields a 
 * bound that does not change when items are animated
 * @param  {item} item
 * @return {Rectangle}      The proper bounds
 */
function getBounds(item){
	return item.getShadowBounds();
	// if(!isGroup(item)) return getShadowBounds(item);

	// // For groups we combine all shadow bounds. In that case, the bound
	// // does not change when children are animated.
	// var bounds;
	// for(var i=0; i<item.children.length;i++){
	// 	var child = item.children[i]
	// 	if(child.isArtefact()) {
	// 		childBounds = getBounds(child)
	// 		bounds = bounds ? bounds.unite(childBounds) : childBounds;
	// 	}
	// }

	// Apply possible group transformations
	// var _tmp = new Path.Rectangle(bounds);
	// bounds = _tmp.transform(item.matrix).bounds
	// _tmp.remove()
	// return bounds
}

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
function select(item) {
	if(item instanceof Array) return item.map(select);
	item.select();
}

/**
 * Deselect an item
 *
 * This removes the bounding box and resets styling specific to selected
 * items.
 * @param  {item} item 
 * @return {None}
 */
function deselect(item) {
	if(item instanceof Array) return item.map(deselect);
	item.deselect()
}

/**
 * Deselects all the currently selected items.
 *
 * Again, we don't use the in-built selection mechanism, but rely on our own
 * bounding boxes. Only items with bounding boxes are deselected, the function
 * does not care about the value of `item.selected`.
 * @param  {array} items 
 * @return {None}
 */
function deselectAll(items) {
	var items = getSelected();

	for(var i=0; i<items.length;i++) {
		deselect(items[i])
	}
}

/**
 * Selects only this item
 * @param  {item} item The only item to select
 * @return {None}
 */
function selectOnly(item) {
	deselectAll();
	select(item);
}

/**
 * Return all selected items
 * @param  {Function} match The match function, defaults to isSelected
 * @return {Array}       Selected items
 */
function getSelected() {
	return project.getItems({
		match: function(i) { return i.isSelected() }
	})
}

/********************************************************/

/**
 * Test if an item is rectangular. 
 *
 * Note that a rectangular is *not* a `Rectangle`. Rather, it is a `Path`
 * with a rectangular shape. We determine this using the `type` property
 * which is set for every item generated through the painter.
 * @param  {Item}  item 
 * @return {Boolean}
 */
function isRectangular(item) {
	return item.className == 'Path' && item.type == 'rectangle'
}

/**
 * Test if an item is circular.
 *
 * Just as for `isRectangular`, the function returns true if the item is 
 * a path with a circular shape, i.e., if it is a `Path.Circle`.
 * @param  {Item}  item 
 * @return {Boolean}
 */
function isCircular(item) {
	return item.className == 'Path' && item.type == 'circle'
}

/**
 * Test if the item is a handle of a bounding box.
 * @param  {Item}  item 
 * @return {Boolean}
 */
function isHandle(item) {
	if(item.type == undefined) {
		return inGroup(item) ? isHandle(item.parent) : false;
	}
	return item.type.startsWith('handle');
}

function isAnimationHandle(item) {
	if(item.type == undefined) {
		return inGroup(item) ? isAnimationHandle(item.parent) : false;
	}
	return item.type == 'handle:animation';
}

/**
 * Test if an object is a segment of a path.
 * @param  {mixed}  item 
 * @return {Boolean}
 */
function isSegment(item) {
	return item.className == 'Segment';
}

/**
 * Test if the item is a group
 * @param  {Item}  item 
 * @return {Boolean} 
 */
function isGroup(item) {
	if(!item) return false;
	return item.className == 'Group'
}

/**
 * Test if an item is in a group
 * @param  {Item} 		item 
 * @return {Boolean}
 */
function inGroup(item) {
	if(item.parent)
		return isGroup(item.parent);
	return false;
}

/********************************************************/

/**
 * Get the adjacent segments of a given segment on a rectangle
 *
 * The adjacent segments are the two segments (corner points) that have either the
 * same x-coordinate, or the same y-coordinate. This makes most sense on a rectangular
 * path, where the adjacent egdes are the two neighbouring corners. 	
 * @param  {Segment} segment 
 * @return {object}         An object `{ sameX: sameXSegment, sameY: sameYSegment }`.
 */
function getAdjacentSegments(segment, tol=1) {
	var segments = segment.path.segments,
			sameX, sameY, cur;
	for(var i=0; i<segments.length; i++) {
		if(segments[i] == segment) continue;
		if(Math.abs(segments[i].point.x - segment.point.x) < tol) sameX = segments[i];
		if(Math.abs(segments[i].point.y - segment.point.y) < tol) sameY = segments[i];
	}
	return {sameX: sameX, sameY: sameY };
}

/**
 * Get the name of the position of a handle or segment w.r.t. its rectangle.
 * 
 * The name of the position is one of `bottomLeft, topLeft, topRight, bottomRight`.
 * The input can be either a handle (Path) or a segment (Segment).			
 * @param  {mixed} item 
 * @return {string}
 */
function getPositionName(item) {
	if(isHandle(item)) {
		return item.type.split(':')[1];
	}
	
	if(isSegment(item)) {
		var rectangle = item.path.bounds;
		positions = ['bottomLeft', 'topLeft', 'topRight', 'bottomRight']
		for(var i =0; i<positions.length; i++) {
			if(item.point.equals(rectangle[positions[i]])) return positions[i];
		}
	}
}

/**
 * Get the index of the handle or segment w.r.t. the corners of the rectangle.
 *
 * The rectangle has of a segments. This function retrieves the index of a segment
 * corresponding to the input to this function. So if you input a handle, you get the
 * index of the segment of the rectangle, corresponding to the handle.
 * @param  {mixed} item 
 * @return {integer}      
 */
function getPositionIndex(item) {
	if(isHandle(item)) {
		return item.parent.children.indexOf(item) - 1;
	}

	if(isSegment(item)) {
		return item.path.segments.indexOf(item);
	}
}

/**
 * Get a segment on a rectangle by the name of its position
 * @param  {string} name      One of `bottomLeft, topLeft, topRight, bottomRight`
 * @param  {Path} rectangle  	A rectangular path
 * @return {Segment}          
 */
function getSegmentByName(name, rectangle) {
	var bounds = rectangle.bounds,
			position = bounds[name];

	for(var i =0; i<rectangle.segments.length; i++) {
		var segment = rectangle.segments[i];
		if(position.equals(segment.point)) return segment;
	}
}

/**
 * Get the segment based on its index.
 * 
 * See `getPositionIndex` for details about the index.
 * @param  {int} index    	Index of the segment  
 * @param  {Path} rectangle Rectangular path
 * @return {Segment}           
 */
function getSegmentByIndex(index, rectangle) {
	return rectangle.segments[index]
}

/**
 * Get the segment corresponding to a handle
 * @param  {Path} handle Handle in a bounding box
 * @param  {Path} item   A rectangular path on which the segment lies
 * @return {Segment}     
 */
function getSegmentByHandle(handle, item) {
	var index = getPositionIndex(handle),
			segment = getSegmentByIndex(index, item);
	return segment
}

/**
 * Get a handle on a boundingBox by its name
 * @param  {string} name        
 * @param  {Group} boundingBox  
 * @return {Path}             
 */
function getHandleByName(name, boundingBox) {
	var handles = boundingBox.children.slice(1);
	for(var i=0; i<handles.length; i++){
		if(getPositionName(handles[i]) == name) return handles[i];
	}
}

/**
 * Find the higest group in which the item is contained
 * @param  {Item} 	item 
 * @return {Group}  The outermost group containing `item`
 */
function getOuterGroup(item) {
	if(inGroup(item.parent)) return getOuterGroup(item.parent);
	return item.parent
}

/********************************************************/

function getCenter(item) {
	return item.bbox.children['shadow'].bounds.center;
}

/********************************************************/

function group(theItems, _pushState=true) {

	var theGroup = new Group(theItems);
	theGroup.type = 'group'
	setupItem(theGroup);
	theGroup.transformContent = false;

	var bounds = theGroup.getShadowBounds()
	theGroup.pivot = new Point(bounds.center);

	selectOnly(theGroup);
	// startAnimation(theItems, false, true)

	if(_pushState) {
		var undo = function() {
			ungroup(theGroup, false)
		}

		var redo = function() {
			// To do: this breaks up the history chain since we no 
			// longer refer to the same group...
			theGroup = group(theItems, false)
		}

		P.History.registerState(undo, redo)		
	}

	return theGroup;

}

/**
 * See https://github.com/paperjs/paper.js/issues/1026
 * @param  {Group} group 
 * @return {Array}       Children
 */
function ungroup(theGroup, _pushState=true) {
	if(theGroup instanceof Array) return theGroup.map(ungroup);
	if(!isGroup(theGroup)) return;

	var theItems = theGroup.removeChildren().filter(function(i){ return i.isArtefact() });
	var parent = theGroup.parent ? theGroup.parent : project.activeLayer;
	parent.insertChildren(theGroup.index, theItems);

	// Stop the animation, to get the actual transformation of the group
	if(theGroup.hasAnimation()) theGroup.getAnimation().stop();
	theItems.map(function(item) { item.transformAll(theGroup.matrix) });
	
	// Remove and reset
	theGroup.destroy();

	if(_pushState) {
		var undo = function() {
			group(theItems, false);
		}
		var redo = function() {
			theItems = ungroup(theGroup, false)
		}
		P.History.registerState(undo, redo)
	}
	return theItems
}

function deleteSelection() {
	var items = getSelected();
	for(var i=0; i<items.length;i++) {
		deselect(items[i])
		items[i].remove()
	}

	var undo = function() {
		items.map(function(i){ project.activeLayer.addChild(i) })
		select(items)
	}

	var redo = function() {
		items.map(function(i){
			deselect(i)
			i.remove();
		});
	}
	
	P.History.registerState(undo, redo)
}

/********************************************************/

/**
 * Clones an item
 *
 * This doesn't work perfectly yet as not all properties are transferred
 * In particular, children of a group don't have the proper names.
 * This could all be solved by moving all custom attributes to the
 * `Item.data` attribute.
 * 
 * @param  {[type]} item [description]
 * @param  {Array}  move [description]
 * @param  {[type]} 0]   [description]
 * @return {[type]}      [description]
 */
function clone(item, move=[0,0]) {
	var copy = item.clone();
	copy.parent = item.parent;
	copy.type = item.type;
	copy.position = copy.position.add(move);

	// Animate the item!
	if(item.hasAnimation()) {
		var type = item.animation.type,
				props = item.animation.properties;
		var onClone = animations[type].onClone || function() {};
		var newProps = jQuery.extend(true, {}, props);
		select(copy);
		copy.animate(type, newProps);
		if(item.isAnimating()) copy.getAnimation().start();
	}

	return copy;
}

function cloneSelection(move=[0,0]) {
	var items = getSelected();
	var copiedItems = items.map(function(i) {return clone(i, move)});
	selectOnly(copiedItems);

	var undo = function() {
		deselect(copiedItems)
		copiedItems.map(function(i){ i.remove() })
	}
	var redo = function() {
		copiedItems.map(function(i){ i.insertAbove(items[0]) })
	}
	P.History.registerState(undo, redo)

	return copiedItems;
}

/********************************************************/

function getColor(i, num_colors, noise=.4, css=true) {
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
}

function getActiveSwatch() {
	var index = $('.swatch.active').data('colorIndex');
	var numSwatches = $('.swatch.active').data('numSwatches');
	return getColor(index, numSwatches)
}

function changeColorSelection() {
	var items = getSelected();
	for(var i=0; i<items.length; i++){
		var item = items[i];
		item.fillColor = getActiveSwatch();
	}
};/**
 * All registered animations
 * @type {Object}
 */
P.animations = {}

/**
 * @name Animation
 * @class
 */
P.Animation = Base.extend(/** @lends Animation */{

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
	initialize: function(item, type, properties) {
		this.item = item;
		this.type = type;
		this.properties = jQuery.extend(true, {}, properties);
		
		// if(!item.animation._prevAnimation) item.animation._prevAnimation = {};
		
		// Load all animation-specific methods.
		var methods = ['onInit', 'onStart', 'onPause', 'onStop', 'onFrame', 
		'onTransform', 'onDrawHandles', 'onUpdate'];
		for(var i=0; i<methods.length; i++) {
			var method = methods[i];
			this['_'+method] = P.animations[this.type][method] || function() {};
		}
		
		this._onInit(this.item, this.properties);
		this.drawHandles();
		return this;
	},

	/**
	 * Draw the animation handles
	 * 
	 * @return {Animation}
	 */
	drawHandles: function() {
		// Clean up old animations
		this.removeHandles();

		// Draw handles
		this.handles = this._onDrawHandles(this.item, this.properties);
		this.handles.parent = this.item.bbox;
		this.handles.type = 'handle:animation';
		return this.handles;
	},

	/**
	 * Remove the animation handles
	 * 
	 * @return {Animation}
	 */
	removeHandles: function() {
		if(this.handles) this.handles.remove();
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
			properties = this._onUpdate(this.item, this.properties, argument);
		} else {
			properties = argument;
		}

		this.properties = $.extend(this.properties, properties);
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
		this._onStart(this.item, this.properties);

		// Start the animation
		this.item.onFrame = function(event) {
			var anim = this.getAnimation();
			anim._onFrame(this, anim.properties, event);
			if(this.isSelected()) anim.drawHandles();
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
		this._onPause(this.item, this.properties);
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
		this._onStop(this.item, this.properties);

		// Update bounding box etc.
		this.item.redrawBoundingBox();
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
		this._onTransform(this.item, this.properties, matrix);
		return this;
	},

	/**
	 * Test if this animation is active: if the animation is currently running.
	 * If the animation is paused or stopped, `isActive` returns `false`.
	 * @return {Boolean}
	 */
	isActive: function() {
		return this.active == true;
	}
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
P.registerAnimation = function(type, animation, defaultProperties) {

	// Set up the animation tool
	if(!animation.tool) animation.tool = new Tool();

	// The current item on which the tool works.
	var item;

	// On Mouse Down
	var _onMouseDown = function(event) {
		item = getSelected()[0]
		if(item == undefined) {
			hitResult = project.hitTest(event.point, {
				fill: true, tolerance: 5
			})
			
			if(!hitResult) return false;
			item = hitResult.item			
		}
		selectOnly(item);

		// Set up animation
		var anim = item.animate(type, defaultProperties);

		// if(!item.animation) item.animation = {};
		// if(!item.animation._prevAnimation) item.animation._prevAnimation = {};
		
		// Update the properties.
		anim.update(event);
	}

	// Mouse drag event
	var _onMouseDrag = function(event) {
		if(!item) return;
		item.getAnimation().update(event);
	}

	// Mouse up event
	var _onMouseUp = function(event) {
		if(!item) return;
		item.getAnimation().start();
		
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
	animation.tool.onMouseDrag = animation.tool.onMouseDown || _onMouseDown;
	animation.tool.onMouseDrag = animation.tool.onMouseDrag || _onMouseDrag;
	animation.tool.onMouseUp = animation.tool.mouseUp || _onMouseUp;

	// Store!
	P.animations[type] = animation;

	return animation;
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
	bounce.onFrame = function(item, props, event) {
		props.position += .01
		var trajectory = props.startPoint.subtract(props.endPoint)
		var relPos = (Math.sin((props.position + .5) * Math.PI) + 1) / 2;
		var newPoint = trajectory.multiply(relPos).add(props.endPoint);
		var delta = newPoint.subtract(item.position);
		
		// Move it!
		item.position = item.position.add(delta)
	}

	// Reset
	bounce.onStop = function(item, props) {
		item.position = props.startPoint.add(props.position)
		props.position = 0;
	}

	// Draws the handles
	bounce.onDrawHandles = function(item, props) {
		var line, dot1, dot2, handles;
		
		line = new Path.Line(props.startPoint, props.endPoint)
		line.strokeColor = mainColor;
		line.strokeWidth = 1;
		
		dot1 = new Path.Circle(props.startPoint, 3)
		dot1.fillColor = mainColor;

		dot2 = dot1.clone();
		dot2.position = props.endPoint;

		handles = new Group([line, dot1, dot2]);
		return handles;
	}

	bounce.onTransform = function(item, props, matrix) {
		props.startPoint = props.startPoint.transform(matrix)
		props.endPoint = props.endPoint.transform(matrix)
	}

	bounce.onClone = function(copy, props) {
		props.startPoint = getCenter(copy);
		return props;
	}

	bounce.onUpdate = function(item, props, event) {
		props.startPoint = getCenter(item);
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

circleTool = new Tool()
var circle;

circleTool.onMouseDown = function(event) {
	deselectAll()
	circle = new Path.Circle({
		center: event.point, 
		radius: 0,
		fillColor: getActiveSwatch()
	});
}

circleTool.onMouseDrag = function(event) {
	var color = circle.fillColor;
	var diff = event.point.subtract(event.downPoint)
	var radius = diff.length / 2
	circle.remove();
	circle = new Path.Circle({
		center: diff.divide(2).add(event.downPoint),
		radius: radius,
		opacity: .9,
		fillColor: color
	});
}

circleTool.onMouseUp = function(event) {
	circle.type = 'circle'
	setupItem(circle);

	// scope
	var circ = circle;
	var undo = function() {
		deselect(circ)
		circ.remove()
	}

	var redo = function() {
		project.activeLayer.addChild(circ);
	}

	P.History.registerState(undo, redo)
};
cloneTool = new Tool();

var currentItems;
cloneTool.onMouseDown = function(event) {
	currentItems = getSelected();
	currentItems = cloneSelection();
	selectOnly(currentItems)
}

cloneTool.onMouseDrag = function(event) {
	moveItem(currentItems, event.delta)
}

cloneTool.onMouseUp = function() {};dragTool = new Tool();
var currentItems;


dragTool.onMouseDown = function(event) {}

dragTool.onMouseDrag = function(event) {
	currentItems.map(function(item) {
		item.move(event.delta)
	})
}

dragTool.onMouseUp = function(event) {

	var undoDelta = new Point(event.downPoint.subtract(event.point))
	var redoDelta = new Point(event.point.subtract(event.downPoint))

	if(redoDelta.length > 1) {
		var items = currentItems;
		
		var undo = function() {
			moveItem(items, undoDelta);
		}
		
		var redo = function() {
			moveItem(items, redoDelta)
		}
		
		P.History.registerState(undo, redo);
	}
};manipulateTool = new Tool();

var currentItems, handle;

manipulateTool.onSwitch = function(event) {
	var item = currentItems[0];
	handle = item;
	currentItems = [item.parent.item];
}

manipulateTool.onMouseDrag = function(event) {
	if(currentItems.length == 1) {
			var item = currentItems[0];

			// Rectangle!
			if( isRectangular(item) ) {
				var segments, adjacents, sameX, sameY, newWidth, newHeight, deltaX, deltaY;

				// Get segment corresponding to the handle, and segments adjacent to that
				segment = getSegmentByHandle(handle, item);
				adjacents = getAdjacentSegments(segment);
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
				item.redrawBoundingBox();

				// Color selected handle
				var newHandleName = getPositionName(segment);
				var	newHandle = getHandleByName(newHandleName, item.bbox);
				newHandle.fillColor = mainColor;
			}

			// Circles are just scaled
			if( isCircular(item) ) {
				// To do: you can move the handle along with the mouse, 
				// that'd be nice!
				var center = item.position,
						radius = item.bounds.width,
						newRadius = event.point.subtract(center).length * 2 - 6,
						scaleFactor = newRadius/radius;
				item.scale(scaleFactor);
				item.redrawBoundingBox();

				// Color the selected handle
				var newHandle = item.bbox.children[1];
				newHandle.fillColor = mainColor;
			}

			// Groups behave very much like circles: they are just scaled.
			// Their radius is different, however.
			if( isGroup(item) ) {
				var center = item.position,
						width = item.bounds.width,
						height = item.bounds.height,
						radius = Math.sqrt(width*width + height*height), // Diagonal
						newRadius = event.point.subtract(center).length * 2 - 6,
						scaleFactor = newRadius/radius;
				item.scale(scaleFactor);
				item.bbox.children['shadow'].scale(scaleFactor);

				// Update the selection box
				item.redrawBoundingBox();

				// item.children.map(function(child) {
				// 	child.redrawBoundingBox(); 
				// })

				// Color selected handle
				var newHandleName = getPositionName(handle);
				var	newHandle = getHandleByName(newHandleName, item.bbox);
				newHandle.fillColor = mainColor;
			}
		}
}

manipulateTool.onMouseUp = function(event) {};/**
 * Rectangle tool
 * 
 * Draws rectangles
 */


rectTool = new Tool();
var rectangle;

rectTool.onMouseDown = function(event) {
	rectangle = new Path.Rectangle(event.point, new Size(0,0));
	setupRectangle(rectangle)
	rectangle.fillColor = getActiveSwatch();
}

rectTool.onMouseDrag = function(event) {
	color = rectangle.fillColor;
	rectangle.remove();
	rectangle = new Path.Rectangle(event.downPoint, event.point);
	rectangle.fillColor = color;
	rectangle.opacity = .9;
}

rectTool.onMouseUp = function() {
	rectangle.type = 'rectangle';
	setupItem(rectangle);

	// Scope!
	var rect = rectangle;

	var undo = function() {
		deselect(rect);
		rect.remove();
	}

	var redo = function() {
		project.activeLayer.addChild(rect);
	}

	P.History.registerState(undo, redo);
};/**
 * Register the rotate animation 
 *
 * @return {null}
 */
(function() {
	
	// The animation object
	rotate = {}

	// Animation iself: frame updates
	rotate.onFrame = function(item, props, event) {
		item.rotate(props.speed, props.center);
		props.degree = ((props.degree || 0) + props.speed) % 360
	}

	// Reset
	rotate.onStop = function(item, props) {

		// Rotate the item back to its original position
		var deg = - props.degree
		item.rotate(deg, props.center)
		props.degree = 0;

		// The path might not be exactly rectangular anymore due to the 
		// rotation. Rounding the coordinates solves the problem.
		if(isRectangular(item)) {
			item.segments.map(function(segment) {
				segment.point.x = Math.round(segment.point.x)
				segment.point.y = Math.round(segment.point.y)
			})
		}
	}

	// Draws the handles
	rotate.onDrawHandles = function(item, props) {
		var border, tl, br, middle, line, dot, handles;

		// Determine the middle of the bounding box: average of two opposite corners
		corners = item.bbox.children[0].segments;
		middle = corners[0].point.add(corners[2].point).divide(2)
		
		line = new Path.Line(middle, props.center)
		line.strokeColor = mainColor;
		line.strokeWidth = 1;
		
		dot = new Path.Circle(props.center, 3)
		dot.fillColor = mainColor;
		dot.position = props.center;

		handles = new Group([line, dot]);
		return handles;
	}

	// Transform the center point
	rotate.onTransform = function(item, props, matrix) {
		props.center = props.center.transform(matrix)
	}

	rotate.onUpdate = function(item, props, event) {
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

selectTool = new Tool()
var currentItems = [];

function switchTool(newTool, event) {
	selectOnly(currentItems);

	// Update the new tool, this is a bit hacky though.
	newTool._downPoint = event.downPoint;
	newTool._point = event.downPoint;
	newTool._downCount += 1; // Not strictly necessary

	// Reactivate selection tool afterwards!
	var _onMouseUp = newTool.onMouseUp
	newTool.onMouseUp = function(event) {
		_onMouseUp(event)
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
	hitResult = project.hitTest(event.point, {
		fill: true,
		tolerance: 5
	})

	// Get currently selected items
	currentItems = getSelected()

	// We hit something!
	if(hitResult) {
		var item = hitResult.item

		// Shadow --> select actual item
		if(item.type == 'shadow') item = item.parent.item;

		// Anmination handles shouldn't do anything
		if(isAnimationHandle(item)) return;
			
		// We hit a handle --> edit selection
		if(isHandle(item)) {
			currentItems = [item];
			switchTool(manipulateTool, event);
		}

		// We hit an object --> drag
		else if(item.type) {
			mode = 'dragging'

			// Select the group if the item we hit is in a group
			if(inGroup(item)) item = getOuterGroup(item);
			
			// If the shift key is pressed, just add the item to the selection.
			if(Key.isDown('shift')) {
				currentItems.push(item);	
			}

			// If you click outside the selection, deselect the current selection
			// and select the thing you clicked on.
			else if(!item.isSelected()) {
				currentItems = [item]
			}
			
			var newTool = Key.isDown('alt') ? cloneTool : dragTool;
			switchTool(newTool, event)

		} else return;
	} 

	// Nothing was hit; start a selection instead
	else {
		currentItems = []
		switchTool(selectionTool, event)
	}
};
selectionTool = new Tool();

var selectRect;

selectionTool.onMouseDown = function(event) {
	currentItems = [];
	selectRect = new Path.Rectangle(event.point, new Size(0,0));
}

selectionTool.onMouseDrag = function(event) {
	if(selectRect)
		selectRect.remove();
	selectRect = new Path.Rectangle(event.downPoint, event.point);
	selectRect.strokeColor = "#333"
	selectRect.dashArray = [2,3]
	selectRect.strokeWidth = 1}

selectionTool.onMouseUp = function(event) {
	// Remove the selection region
	if(selectRect) selectRect.remove();

	// Find all items in the selection area
	rect = new Rectangle(event.downPoint, event.point)
	var items = project.activeLayer.getItems({ 
		overlapping: rect,
		match: function(item) { 
			return item.isArtefact()
		}
	});
	console.log(items)

	// If we put this in the match, it doesn't work?
	items = items.filter(function(item) { return !inGroup(item) })
	console.log(items)

	// And select!
	select(items);
};/**
 * Painter.js
 */

paper.install(window);

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */
// var P = {};

var mainColor = '#78C3D0';


$(window).ready(function() {

	paper.setup('canvas');

	// Hmmmm....
	bounceTool = P.animations.bounce.tool
	rotationTool = P.animations.rotate.tool
	
	function onKeyDown(event) {

		if(event.key == 'backspace' || event.key == 'd') {
			deleteSelection()
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
			group(getSelected())
		}

		else if(event.key =='u') {
			ungroup(getSelected())
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

	// Demo
	r = new Path.Rectangle([20,30,100,140])
	r.fillColor = getColor(0, 7)
	// r.selected = true
	r.type = 'rectangle'
	setupRectangle(r)
	setupItem(r)

	c = new Path.Circle([300,100], 40)
	c.fillColor = getColor(1, 7)
	// c.selected = true
	c.type = 'circle'
	setupItem(c)
	select(c)
	select(r)
	group(getSelected())
	deselectAll()


		// Demo
	r = new Path.Rectangle([200,200,100,140])
	r.fillColor = getColor(3, 7)
	// r.selected = true
	r.type = 'rectangle'
	setupItem(r)
setupRectangle(r)
	c = new Path.Circle([500,300], 40)
	c.fillColor = getColor(4, 7)
	// c.selected = true
	c.type = 'circle'
	setupItem(c)
	// select(c)
	select(r)

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
		group(getSelected())
	})

	$('a.tool[data-tool=ungroup]').on('click', function() {
		ungroup(getSelected())
	})

	$('a.tool[data-tool=delete]').on('click', function() {
		deleteSelection()
	})

	$('a.tool[data-tool=clone]').on('click', function() {
		cloneSelection([20,20])
	})

	$('a.tool[data-tool=playpause]').on('click', function() {
		if($(this).data('state') == 'play') {
			startAnimation(getSelected());
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')

		} else {
			stopAnimation(getSelected());
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
		resetAnimation(getSelected(), 'rotate');
	})

	// Add all swatches
	var $swatches = $('.swatches'),
			numSwatches = parseInt($swatches.data('num-swatches'));
	for(var i=0; i<numSwatches; i++) {

		// Get color without noise
		var color = getColor(i, numSwatches, 0);

		// Add swatch handle
		var $swatch = $('<a class="swatch">' + (i+1) + '</a>')
					.css('backgroundColor', color)
					.data('colorIndex', i)
					.data('numSwatches', numSwatches)
					.appendTo($swatches)
					.on('click', function() {
						$('.swatch').removeClass('active');
						$(this).addClass('active');
						changeColorSelection();
					})
		if(i == 0) $swatch.addClass('active');
	}



})