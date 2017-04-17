/**
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
		this._loadActions();
		this._onInit(this.artefact, this.properties);
		this.drawHandles();
	},

	_loadActions: function() {
		var actions = ['onInit', 'onStart', 'onPause', 'onStop', 'onFrame', 
		'onTransform', 'onDrawHandles', 'onUpdate'];
		for(var i=0; i<actions.length; i++) {
			var action = actions[i];
			this['_'+action] = P.animations[this.type][action] || function() {};
		}
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
		delete this.item.data._animation
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
	},

	export: function() {
		return {
			'properties': this.cloneProperties(),
			'type': this.type + ''
		}
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
P.registerAnimation = function(type, newAnimation, defaultProperties) {
	
	// Set up the animation tool
	if(!newAnimation.tool) newAnimation.tool = new paper.Tool();

	// The current item on which the tool works.
	var artefact;
	var prevAnimation;

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

		P.History.registerState(undo, redo);
	}

	// Store methods if none exist
	newAnimation.tool.onMouseDown = newAnimation.tool.onMouseDown || _onMouseDown;
	newAnimation.tool.onMouseDrag = newAnimation.tool.onMouseDrag || _onMouseDrag;
	newAnimation.tool.onMouseUp = newAnimation.tool.mouseUp || _onMouseUp;

	// Store!
	P.animations[type] = newAnimation;

	return newAnimation;
}