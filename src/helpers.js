;
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
}