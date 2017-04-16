/**
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
}