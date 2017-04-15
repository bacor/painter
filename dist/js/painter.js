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


function setupItem(item) {
	item.animation = undefined;
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
		if(isGroup(item)) var bounds = getBounds(item);
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

function showBoundingBox(item) {
	if(item instanceof Array) return item.map(showBoundingBox);

	if(item.bbox) {
		item.bbox.visible = true
	}
	else {
		bbox = getBoundingBox(item);
		bbox.item = item;
		item.bbox = bbox;
		item.insertBelow(bbox)
	}
}

function hideBoundingBox(item) {
	if(item instanceof Array) return item.map(hideBoundingBox);
	if(item.bbox) item.bbox.visible = false;
}

function redrawBoundingBox(item) {
	if(item instanceof Array) return item.map(redrawBoundingBox);
	if(item.bbox) item.bbox.remove();
	item.bbox = undefined;

	return showBoundingBox(item);
}

function getShadowBounds(item){
	if(!item.bbox) return false;
	return item.bbox.children['shadow'].bounds
}

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
	if(!isGroup(item)) return getShadowBounds(item);

	// For groups we combine all shadow bounds. In that case, the bound
	// does not change when children are animated.
	var bounds;
	for(var i=0; i<item.children.length;i++){
		var child = item.children[i]
		if(isItem(child)) {
			childBounds = getBounds(child)
			bounds = bounds ? bounds.unite(childBounds) : childBounds;
		}
	}

	// Apply possible group transformations
	// var _tmp = new Path.Rectangle(bounds);
	// bounds = _tmp.transform(item.matrix).bounds
	// _tmp.remove()
	return bounds
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
	if(!item || isSelected(item)) return;
	showBoundingBox(item)

	if(hasAnimation(item))
		drawAnimationHandles(item);

	// if(isGroup(item)) item.children.map(showBoundingBox);
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
	hideBoundingBox(item);
	item.strokeColor = undefined;
	item.dashArray = undefined;
	removeAnimationHandles(item);
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
	var items = project.getItems({
		match: isSelected
	})

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
function getSelected(match=isSelected) {
	return project.getItems({
		match: match
	})
}

/********************************************************/

/**
 * Test if an item is selected
 * @param  {Item}  item 
 * @return {Boolean}
 */
function isSelected(item) {
	return item.bbox != undefined && item.bbox.visible == true
}

/**
 * Test if an item is a bounding box
 * @param  {Item}  item 
 * @return {Boolean}
 */
function isBoundingBox(item) {
	return item.type == 'boundingBox'
}

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

/**
 * Tests if a group has been hit
 * @param  {HitResult} hitResult 
 * @return {Boolean}
 */
function hitGroup(hitResult) {
	return inGroup(hitResult.item)
}

function hasAnimation(item, type=false) {
	if(item.animation == undefined) return false; 
	if(item.animation.type == undefined) return false;
	if(type) return item.animation.type == type;
	return true;
}

function isAnimating(item, type=false) {
	return hasAnimation(item, type) && item.animation.active == true;
} 

/**
 * Test if an item is rotating
 * @param  {Item}  item 
 * @return {Boolean}    
 */
function isRotating(item) {
	return isAnimating(item, 'rotate')
}

function isItem(item) {
	if(isRectangular(item) || isCircular(item)) return true;
	if(isGroup(item) && !isBoundingBox(item)) return true;
	return false
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

/**
 * Move an item, its bounding box and animation.
 *
 * This function moves all the objects related to an item: its
 * bounding box and the animation. The animation is moved by calling
 * the `onTransform` method with a translation matrix. 
 *
 * @todo Why not have a general `transformItem` function?
 * @param  {item} item  	
 * @param  {Point} delta 
 * @return {None}      
 */
function moveItem(item, delta) {
	if(item instanceof Array) 
		return item.map(function(i) { moveItem(i, delta) });

	// Move the item
	item.position = item.position.add(delta);

	// Bounding box, only if it exists
	if(item.bbox) item.bbox.position = item.bbox.position.add(delta);
	
	// Move the animation. We just apply a specific type of transformation:
	// a translation. The rest should be handled by the animation.
	var matrix = new Matrix().translate(delta);
	transformAnimation(item, matrix);

	if(item.animation && item.animation._prevAnimation) {
		item.animation._prevAnimation = jQuery.extend(true, {}, item.animation);
	}
}

function getCenter(item) {
	return item.bbox.children['shadow'].bounds.center;
}

/********************************************************/

function group(theItems, _pushState=true) {

	var theGroup = new Group(theItems);
	theGroup.type = 'group'
	theGroup.transformContent = false;

	var bounds = getBounds(theGroup)
	theGroup.pivot = new Point(bounds.center);

	setupItem(theGroup);
	selectOnly(theGroup)
	startAnimation(theItems, false, true)

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

	var theItems = theGroup.removeChildren().filter(isItem);
	var parent = theGroup.parent ? theGroup.parent : project.activeLayer;
	parent.insertChildren(theGroup.index, theItems);

	// Transform children just like the group
	for(var i=0; i<theItems.length; i++){
		var item = theItems[i];
		
		if(!hasAnimation(theGroup)) {
			item.transform(theGroup.matrix);
			if(item.bbox) item.bbox.transform(theGroup.matrix);
		}
		
		// Only called if hasAnimation(item)
		transformAnimation(item, theGroup.matrix);
	}

	// Remove and reset
	deselect(theGroup);
	theGroup.remove();
	select(theItems)

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
	if(hasAnimation(item)) {
		var type = item.animation.type,
				props = item.animation.properties;
		var onClone = animations[type].onClone || function() {};
		var newProps = jQuery.extend(true, {}, props);
		select(copy);
		initAnimation(copy, type, newProps);
		if(isAnimating(item)) startAnimation(copy);
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
};
var initAnimation, startAnimation, stopAnimation, resetAnimation;


/**
 * All registered animations
 * @type {Object}
 */
var animations = {}

/**
 * Initialize an animation.
 *
 * Set up an item to be able to start an animation later on.
 * @param  {mixed} item        The item
 * @param  {string} type       The type of animation
 * @param  {object} properties An object of animation properties
 * @return {item}        		   The item
 */
function initAnimation(item, type, properties) {
	// Remove old animations
	resetAnimation(item)
	if(hasAnimation(item)) item.animation.handles.remove();
	if(!item.animation) item.animation = {};
	if(!item.animation._prevAnimation) item.animation._prevAnimation = {};
	
	item.animation.type = type;
	item.animation.properties = jQuery.extend(true, {}, properties);

	var onInit = animations[type].onInit || function(){};
	onInit(item, properties);
	
	drawAnimationHandles(item)

	return item;
}

/**
 * Starts an animation
 * @param  {item/array} item		 An item or array of items
 * @param  {string} type  The type of animation to start
 * @return {Boolean}			`true` on success; `false` if item does not have this  animation
 */
function startAnimation(item, type=false, recurse=true) {
	if(item instanceof Array) 
		return item.map(function(i) { startAnimation(i, type, recurse) });
	if(isGroup(item) && recurse) 
		startAnimation(item.children, type, false);
	if(!hasAnimation(item, type)) 
		return false;

	var type = type || item.animation.type;
	item.animation.active = true;
	var onStart = animations[type].onStart || function(){};
	onStart(item, item.animation.properties);

	item.onFrame = function(event) {
		animations[type].onFrame(this, this.animation.properties, event)
		if(isSelected(this)) {
			drawAnimationHandles(this, type, this.animation.properties);
		}
	}
	return true;
}

/**
 * Stops an animation
 *
 * Stops the animation in its current state. The animation can be continued by
 * calling `startAnimation`. The function fires the `onStop` method of the 
 * current animation type.
 * @param  {item} item 
 * @return {Boolean}			`true` on success; `false` if item does not have this  animation
 */
function stopAnimation(item) {
	if(item instanceof Array)
		return item.map(function(i) { stopAnimation(i) });
	if(!hasAnimation(item)) 
		return false;

	var type = item.animation.type;
	item.animation.active = false;
	item.onFrame = undefined;

	var onStop = animations[type].onStop || function(){};
	onStop(item, item.animation.properties);
	return true;
}

/**
 * Reset an animation
 *
 * The item is restored to it original, unanimated state.
 * @param  {item} item 
 * @param  {String} type type of animation
 * @return {Boolean}     `true` on success; `false` if item does not have this  animation
 */
function resetAnimation(item, recurse=false) {
	if(item instanceof Array)
		return item.map(function(i) { resetAnimation(i, recurse) });
	if(!isItem(item)) return false;
	if(isGroup(item) && recurse) resetAnimation(item.children, true);
	if(!hasAnimation(item)) return false;

	var type = item.animation.type;
	stopAnimation(item, type);

	// Do animation specific stuff
	var onReset = animations[type].onReset || function(){}
	onReset(item, item.animation.properties);

	// Update bounding box etc.
	redrawBoundingBox(item);
	return true;
}

/**
 * Draws the animation handles for an item
 *
 * It uses the drawing method in the animation object.
 * @param  {item} item 
 * @return {Group} The animation handles
 */
function drawAnimationHandles(item) {
	
	// Clean up old animations
	removeAnimationHandles(item)

	// Draw handles
	var type = item.animation.type;
	var props = item.animation.properties;

	var drawHandles = animations[type].drawHandles || function() {};
	var handles = drawHandles(item, props);
	handles.parent = item.bbox;
	handles.type = 'handle:animation';
	item.animation.handles = handles;	

	return handles;
}

/**
 * Remove the animation handles for an item.
 * @param  {item} item 
 * @return {None}      
 */
function removeAnimationHandles(item) {
	if(item.animation && item.animation.handles)
		item.animation.handles.remove();
}

/**
 * Applies a transformation to the animation
 * @param  {item} item   
 * @param  {Matrix} matrix the matrix
 * @return {None}        
 */
function transformAnimation(item, matrix) {
	if(item instanceof Array)
		return item.map(function(i) { transformAnimation(i, matrix) });
	if(!isItem(item)) return false;
	if(!hasAnimation(item)) return false;

	var type = item.animation.type; 
	var properties = item.animation.properties;
	animations[type].onTransform(item, properties, matrix);
}

/**
 * Update the animation properties of an item 
 * @param  {item} item       
 * @param  {Object} properties An object with animation properties
 * @return {Object}            The updated properties
 */
function updateAnimation(item, properties, event) {
	if(!properties) {
		var type = item.animation.type
		var onUpdate = animations[type].onUpdate || function() {};
		var properties = onUpdate(item, item.animation.properties, event);
	}
	item.animation.properties = $.extend(item.animation.properties, properties);
	drawAnimationHandles(item)
	return item.animation.properties
}

/**
 * Register an animation
 *
 * An animation moves an item periodically based on several parameters which
 * are set graphically by a set of handles. The rotation animation for example
 * has a single parameter: the center point around which the item rotates. 
 * The drawing app iteracts with the animation through various functions. The 
 * most important ones are
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
 * - `onReset(item, properties)` Should undo the animation and reset the item.
 * @param  {String} type              Name of the animation
 * @param  {Object} animation         Animation object
 * @param  {Object} defaultProperties Default properties
 * @return {None}                   
 */
function registerAnimation(type, animation, defaultProperties) {

	// Set up the animation tool
	if(!animation.tool) animation.tool = new Tool();

	// The current item on which the tool works.
	var currentItem;

	// On Mouse Down
	animation.tool.onMouseDown = animation.tool.onMouseDown || function(event) {
		currentItem = getSelected()[0]
		if(currentItem == undefined) {
			hitResult = project.hitTest(event.point, {
				fill: true, tolerance: 5
			})
			
			if(!hitResult) return false;
			currentItem = hitResult.item			
		}
		selectOnly(currentItem);

		// Set up animation
		initAnimation(currentItem, type, defaultProperties)
		
		// Update the properties.
		updateAnimation(currentItem, undefined, event);

	}

	// Mouse drag event
	animation.tool.onMouseDrag = animation.tool.onMouseDrag || function(event) {
		if(!currentItem) return;
		updateAnimation(currentItem, undefined, event);
	}

	// Mouse up event
	animation.tool.onMouseUp = animation.tool.mouseUp || function(event) {
		if(!currentItem) return;
		startAnimation(currentItem);

		var item = currentItem;
		var prevAnimation = jQuery.extend(true, {}, item.animation._prevAnimation);
		var curAnimation = jQuery.extend(true, {}, item.animation);
		item.animation._prevAnimation = curAnimation;

 		var undo = function() {
 	 		resetAnimation(item);

			if(Object.keys(prevAnimation).length == 0) {
				item.animation._prevAnimation = {}
				item.animation = {}
			} else {
	 			item.animation = prevAnimation
	 			updateAnimation(item, prevAnimation.properties)
	 			startAnimation(item)
	 		}
 		}

 		var redo = function() {
 			resetAnimation(item)
 			item.animation = curAnimation
 			updateAnimation(item, curAnimation.properties)
 			startAnimation(item)
 			select(item)
 		}

		P.History.registerState(undo, redo);
	}

	// Store!
	animations[type] = animation;
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
	bounce.onReset = function(item, props) {
		item.position = props.startPoint.add(props.position)
		props.position = 0;
	}

	// Draws the handles
	bounce.drawHandles = function(item, props) {
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
	registerAnimation('bounce', bounce, { speed: 2, position: 0 })

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
	// todo: this is not the illustrator-type behaviour. 
	// Is that a problem?
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
	moveItem(currentItems, event.delta)
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
			var item = currentItems[0]

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
				newWidth  = Math.abs(segment.point.x - (sameY.point.x + event.delta.x))
				newHeight = Math.abs(segment.point.y - (sameX.point.y + event.delta.y))
				deltaX = (newWidth <= 3) ? 0 : event.delta.x;
				deltaY = (newHeight <= 3) ? 0 : event.delta.y;
				sameX.point   = sameX.point.add([deltaX, 0]);
				sameY.point   = sameY.point.add([0, deltaY]);
				segment.point = segment.point.add([deltaX, deltaY]);

				// Update bounding box
				redrawBoundingBox(item)

				// Color selected handle
				var newHandleName = getPositionName(segment);
				var	newHandle = getHandleByName(newHandleName, item.bbox);
				newHandle.fillColor = mainColor
			}

			// Circles are just scaled
			if( isCircular(item) ) {
				// To do: you can move the handle along with the mouse, 
				// that'd be nice!
				var center = item.position,
						radius = item.bounds.width,
						newRadius = event.point.subtract(center).length * 2 - 6,
						scaleFactor = newRadius/radius;
				item.scale(scaleFactor)
				redrawBoundingBox(item);

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
				item.scale(scaleFactor)
				item.bbox.children['shadow'].scale(scaleFactor)

				// Update the selection box
				redrawBoundingBox(item);

				// Color selected handle
				var newHandleName = getPositionName(handle)
				var	newHandle = getHandleByName(newHandleName, item.bbox);
				newHandle.fillColor = mainColor
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
	rectangle.fillColor = getActiveSwatch()
}

rectTool.onMouseDrag = function(event) {
	color = rectangle.fillColor
	rectangle.remove()
	rectangle = new Path.Rectangle(event.downPoint, event.point);
	rectangle.fillColor = color
	rectangle.opacity = .9
}

rectTool.onMouseUp = function() {
	rectangle.type = 'rectangle'
	setupItem(rectangle);

	// Scope!
	var rect = rectangle;

	var undo = function() {
		deselect(rect)
		rect.remove()
	}

	var redo = function() {
		project.activeLayer.addChild(rect);
	}

	P.History.addState(undo, redo)
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
	rotate.onReset = function(item, props) {

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
	rotate.drawHandles = function(item, props) {
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
	registerAnimation('rotate', rotate, { speed: 2 })

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
			else if(!isSelected(item)) {
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
	
		// Don't match elements inside a group (the group will be selected already)
		match: function(item) { 
			return !inGroup(item) && !isBoundingBox(item)
		}
	});

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
	bounceTool = animations.bounce.tool
	rotationTool = animations.rotate.tool
	
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