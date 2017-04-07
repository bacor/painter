;/**
 * helpers.js
 *
 * This file contains various helpers
 */

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
	var parts = []

	// Rectangles, groups or an array of multiple items 
	// all get a rectangular bounding box
	if((isRectangular(item) || isGroup(item)) || item.className == 'Rectangle') {

		// Bounds around the item
		var bounds = (isGroup(item) || isRectangular(item)) ? item.bounds : item;

		// Determine the rectangle on which to base the bounding box. For a rectangular
		// path, this should be that very path (to get the index ordering right),
		// for others it doesn't matter, but it is convenient to instantiate a Path first
		var rect = isRectangular(item) ? item : new Path.Rectangle(bounds)
		
		// The border of the bounding box (expanded slightly)
		var border = new Path.Rectangle(rect.bounds.expand(12))
		border.strokeColor = mainColor
		parts.push(border)

		// Add the handles in the same order as they occur in rect. In this way, the order
		// is unchanged for rectangular paths and we can relate handles to segments in a
		// straightforward way.
		for(var i=0; i<rect.segments.length; i++) {
			var positionName = getPositionName(rect.segments[i])
					position = border.bounds[positionName],
					handle = getHandle(position);

			handle.type = 'handle:' + positionName
			parts.push(handle)
		}

		// Remove the auxiliary rectangle for groups/Rectangles
		if(!isRectangular(item)) rect.remove();
	}

	// Circles get a circular bounding box
	if(isCircular(item)) {

		var radius = (item.bounds.width + 12) / 2
		var center = item.position 
		var border = new Path.Circle(item.position, radius)
		border.strokeColor = mainColor
		var handle = getHandle([center.x + radius, center.y])
		parts.push(border)
		parts.push(handle)
	}

	var boundingBox = new Group(parts)
	boundingBox.type = 'boundingBox'
	boundingBox.center = boundingBox.bounds.center;
	return boundingBox
}

function showBoundingBox(item) {
	if(item.bbox) {
		item.bbox.visible = true
	}
	
	else {
		boundingBox = getBoundingBox(item);
		boundingBox.item = item;
		item.bbox = boundingBox;
	}
}

function hideBoundingBox(item) {
	if(item.bbox) item.bbox.visible = false;
}

function redrawBoundingBox(item) {
	item.bbox.remove()
	item.bbox = undefined
	return showBoundingBox(item)
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
	if(isSelected(item)) return;
	showBoundingBox(item)	

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
}

/**
 * Reselect = deselect + select
 * @param  {item} item 		
 * @return {None}      
 */
function reselect(item){
	deselect(item)
	select(item)
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

function selectOnly(item) {
	deselectAll();
	select(item);
}

function getSelected(match=isSelected) {
	return project.getItems({
		match: match
	})
}

function moveItems(items, delta) {
	for(var i=0; i<items.length; i++) {
		
		var item = items[i],
				bbox = item.bbox;

		// If this is a group, move all the children individually,
		// but keep the group itself fixed.
		if(isGroup(item)) moveItems(item.children, delta);
		if(!inGroup(item)) item.position = item.position.add(delta);

		// BOunding box, only if it exists
		if(bbox) bbox.position = bbox.position.add(delta);
		
		// Move the focus point around which the current item rotates
		if(item.focusPoint)
			item.focusPoint = item.focusPoint.add(delta);


	}
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
	if(item.type == undefined) return false;
	return item.type.startsWith('handle');
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
	return item.className == 'Group'
}

/**
 * Test if an item is in a group
 * @param  {Item} 		item 
 * @return {Boolean}
 */
function inGroup(item) {
	return isGroup(item.parent)
}

/**
 * Tests if a group has been hit
 * @param  {HitResult} hitResult 
 * @return {Boolean}
 */
function hitGroup(hitResult) {
	return inGroup(hitResult.item)
}

/**
 * Test if an item is rotating
 * @param  {Item}  item 
 * @return {Boolean}    
 */
function isRotating(item) {
	return item.rotating != undefined && item.rotating == true;
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

// function hasRotationRadius(bounding)

/********************************************************/


function removeRotationRadius(item) {
	var children = item.bbox.children;
	for(var i=0; i<children.length; i++) {
		if(!children[i].type) continue;
		if(children[i].type.startsWith('radius')) {
			children[i].remove()
		}
	}
}

function drawRotationRadius(item, center) {
	var border, tl, br, middle, line, dot;
	removeRotationRadius(item);

	// Determine the middle of the bounding box: average of two opposite corners
	corners = item.bbox.children[0].segments;
	middle = corners[0].point.add(corners[2].point).divide(2)
	
	line = new Path.Line(middle, center)
	line.type = 'radius:line'
	line.strokeColor = mainColor;
	line.strokeWidth = 1;
	item.bbox.appendTop(line)

	dot = new Path.Circle(center, 3)
	dot.type = 'radius:dot'
	dot.fillColor = mainColor;
	dot.position = center;
	item.bbox.appendTop(dot)
}

function rotate(item, focusPoint) {
	item.rotating = true;
	item.focusPoint = focusPoint;
	drawRotationRadius(item, focusPoint)

	item.onFrame = function(event) {
			this.rotate(rotationSpeed, this.focusPoint);
			this.bbox.rotate(rotationSpeed, this.focusPoint);
			this.rotationDegree = ((this.rotationDegree || 0) + rotationSpeed) % 360
		}
}

function stopRotating(item) {
	item.rotating = false;
	item.onFrame = undefined;
}

function continueRotating(item) {
	rotate(item, item.focusPoint)
}

function resetRotation(item) {
	stopRotating(item);

	// Rotate back to its original position
	var deg = - item.rotationDegree
	item.rotate(deg, item.focusPoint)
	item.bbox.rotate(deg, item.focusPoint);
	item.rotationDegree = 0;

	// The path might not be exactly rectangular anymore due to the 
	// rotation. Rounding the coordinates solves the problem.
	if(isRectangular(item)) {
		item.segments.map(function(segment) {
			segment.point.x = Math.round(segment.point.x)
			segment.point.y = Math.round(segment.point.y)
		})
	}

	// Update bounding box etc.
	redrawBoundingBox(item);
	selectOnly(item);
}

function bounce(item, startPoint, endPoint) {
	item.bouncing = true;
	item.startPoint = startPoint;
	item.endPoint = endPoint
	item.bouncePosition = 0;
	// drawRotationRadius(item, focusPoint)
	var dot = new Path.Circle([20,20], 5)
	dot.fillColor = 'orange'
	// console.log(dot)

	item.onFrame = function(event) {
		var center = this.bbox.center;
		var trajectory = this.startPoint.subtract(this.endPoint)

		this.bouncePosition += .01
		var relPos = (Math.sin((this.bouncePosition + .5) * Math.PI) + 1) / 2;
		var newPoint = trajectory.multiply(relPos).add(this.endPoint);

		var delta = newPoint.subtract(this.position);
		
		moveItems([this], delta)
	}
}


/********************************************************/

function getCrosshair(d=7) {
	// Old: crosshair with lines
	// var line1 = new Path.Line([d, 0], [d, 2*d])
	// var line2 = new Path.Line([0, d], [2*d, d])

	var circle = new Path.Circle([d, d], d)
	circle.fillColor = 'white'
	circle.strokeColor = mainColor

	var dot = new Path.Circle([d, d], 3)
	dot.fillColor = mainColor
	var crosshair = new Group([circle, dot])
	
	return crosshair
}
