
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
	if(hasAnimation(item))
		item.animation.handles.remove();
	
	item.animation = {
		type: type,
		properties: properties
	};

	var onInit = animations[type].onInit || function(){};
	onInit(item, properties);
	return item;
}

/**
 * Starts an animation
 * @param  {item/array} item		 An item or array of items
 * @param  {string} type  The type of animation to start
 * @return {Boolean}			`true` on success; `false` if item does not have this  animation
 */
function startAnimation(item, type) {
	if(item instanceof Array) 
		return item.map(function(i) { startAnimation(i, type) });
	if(!hasAnimation(item, type)) 
		return false;

	item.animation.active = true;
	var onStart = animations[type].onStart || function(){};
	onStart(item, item.animation.properties);

	item.onFrame = function(event) {
		animations[type].onFrame(event, this, this.animation.properties)
		if(isSelected(this)){
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
 * @param  {String} type 	Animation type
 * @return {Boolean}			`true` on success; `false` if item does not have this  animation
 */
function stopAnimation(item, type) {
	if(item instanceof Array)
		return item.map(function(i) { stopAnimation(i, type) });
	if(!hasAnimation(item, type)) 
		return false;

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
function resetAnimation(item) {
	if(item instanceof Array)
		return item.map(function(i) { resetAnimation(i) });
	if(!hasAnimation(item)) 
		return false;

	var type = item.animation.type;
	stopAnimation(item, type);

	// Do animation specific stuff
	var onReset = animations[type].onReset || function(){}
	onReset(item, item.animation.properties);

	// Update bounding box etc.
	redrawBoundingBox(item);
	selectOnly(item);
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
 * Update the animation properties of an item 
 * @param  {item} item       
 * @param  {Object} properties An object with animation properties
 * @return {Object}            The updated properties
 */
function updateAnimationProperties(item, properties) {
	item.animation.properties = $.extend(item.animation.properties, properties);
	return item.animation.properties
}
