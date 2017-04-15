
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
}