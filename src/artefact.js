
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
})