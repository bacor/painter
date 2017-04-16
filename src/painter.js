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
