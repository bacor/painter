/**
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
		project.activeLayer.addChild(this.item);
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
 * @name Artefact.Rectangle
 * @class A rectangular Artefact. Yes, really just a rectangle.
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
 * @name  Artefact.Circle
 * @class  A circular Artefact.
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

/**
 * @name Artefact.Group
 * @class The group Artefact is an artefact consisting of several others.
 * It is really just a group with some added niceties.
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

	/**
	 * Ungroup. Destroys the group and inserts the children Artefact at the
	 * same position in the layer.
	 * 
	 * @return {Artefact[]} Artefacts
	 */
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

	/**
	 * Override the default destroy
	 * @param  {Boolean} [destroyChildren=true] Destroy the children as well?
	 * @return {}
	 */
	destroy: function destroy(destroyChildren=false) {
		if(destroyChildren) this.children.mmap('destroy');
		destroy.base.call(this);
	}
})