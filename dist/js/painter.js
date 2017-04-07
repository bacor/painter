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
	if(item.boundingBox) {
		item.boundingBox.visible = true
	}
	
	else {
		boundingBox = getBoundingBox(item);
		boundingBox.items = [item];
		item.boundingBox = boundingBox;
	}
}

function hideBoundingBox(item) {
	if(item.boundingBox) item.boundingBox.visible = false;
}

function redrawBoundingBox(item) {
	item.boundingBox.remove()
	item.boundingBox = undefined
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
	// if(item.boundingBox) item.boundingBox.visible = false;
	// // item.boundingBox = undefined;
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
				bbox = item.boundingBox;

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
	return item.boundingBox != undefined && item.boundingBox.visible == true
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
	var children = item.boundingBox.children;
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
	corners = item.boundingBox.children[0].segments;
	middle = corners[0].point.add(corners[2].point).divide(2)
	
	line = new Path.Line(middle, center)
	line.type = 'radius:line'
	line.strokeColor = mainColor;
	line.strokeWidth = 1;
	item.boundingBox.appendTop(line)

	dot = new Path.Circle(center, 3)
	dot.type = 'radius:dot'
	dot.fillColor = mainColor;
	dot.position = center;
	item.boundingBox.appendTop(dot)
}

function rotate(item, focusPoint) {
	focusPoint = focusPoint;
	item.rotating = true;
	item.focusPoint = focusPoint;
	drawRotationRadius(item, focusPoint)

	item.onFrame = function(event) {
			this.rotate(rotationSpeed, this.focusPoint);
			this.boundingBox.rotate(rotationSpeed, this.focusPoint);
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
	item.boundingBox.rotate(deg, item.focusPoint);
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
;/**
 * Painter.js
 */

paper.install(window);

var mainColor = '#78C3D0';

function groupSelection() {
	var items = getSelected();
	var group = new Group(items);
	group.type = 'group'
	// group.fillColor = group.children[0].fillColor
	selectOnly(group)
}

function ungroupSelection() {
		
	// Get all currently selected groupos
	var groups = project.getItems({
		class: Group,
		match: isSelected
	})

	// Remove the items from the group and insert them at
	// the same position in the tree.
	// See https://github.com/paperjs/paper.js/issues/1026
	for( var i=0; i<groups.length; i++) {
		var group = groups[i];

		children = group.removeChildren();
		select(children)

		group.parent.insertChildren(group.index,  children);
		deselect(group);
		group.remove();
	}
}

function deleteSelection() {
	items = getSelected();
	for(var i=0; i<items.length;i++) {
		deselect(items[i])
		items[i].remove()
	}
}

function cloneSelection(move=[0,0]) {
	var items = getSelected(), 
			copiedItems = [];

	// Clone all the currently selected items
	for(var i=0; i<items.length; i++) {
		copy = items[i].clone();
		copy.position = copy.position.add(move);
		copy.type = items[i].type;
		copiedItems.push(copy);
	}

	selectOnly(copiedItems);
	return copiedItems;
}

function stopRotatingSelection() {
	var items = getSelected()
	items.map(stopRotating);
}

function continueRotatingSelection() {
	var items = getSelected()
  items.map(continueRotating);
}

function resetRotationSelection() {
	var items = getSelected();
	items.map(resetRotation);
}

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

$(window).ready(function() {

	paper.setup('canvas');

	function onKeyDown(event) {
		if(event.key == 'backspace' || event.key == 'd') {
			deleteSelection()
		}

		else if(event.key == 'space') {
			$('a.tool[data-tool=playpause]').click();
		}

		else if(event.key == 'z') {
			$('a.tool[data-tool=reset]').click();
		}

		else if(event.key =='g') {
			groupSelection()
		}

		else if(event.key =='u') {
			ungroupSelection()
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

	// // Demo
	// r = new Path.Rectangle([20,30,100,140])
	// r.fillColor = 'red'
	// // r.selected = true
	// r.type = 'rectangle'

	// c = new Path.Circle([300,100], 40)
	// c.fillColor = 'green'
	// // c.selected = true
	// c.type = 'circle'
	// select(c)
	// select(r)
	// groupSelection()
	// deselectAll()


	// 	// Demo
	// r = new Path.Rectangle([200,200,100,140])
	// r.fillColor = 'green'
	// // r.selected = true
	// r.type = 'rectangle'

	// c = new Path.Circle([500,300], 40)
	// c.fillColor = 'green'
	// // c.selected = true
	// c.type = 'circle'
	// // select(c)
	// select(r)

	// // rotate(c, new Point([100,100]))
	// // rotate()


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
		groupSelection()
	})

	$('a.tool[data-tool=ungroup]').on('click', function() {
		ungroupSelection()
	})

	$('a.tool[data-tool=delete]').on('click', function() {
		deleteSelection()
	})

	$('a.tool[data-tool=clone]').on('click', function() {
		cloneSelection([20,20])
	})

	$('a.tool[data-tool=playpause]').on('click', function() {
		if($(this).data('state') == 'play') {
			continueRotatingSelection()
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')
		} else {
			stopRotatingSelection()
			$(this).find('span').html('play <code>space</code>')
			$(this).data('state', 'play')
		}
	})

	$('a.tool[data-tool=rotate]').on('click', function() {
		rotationTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=reset]').on('click', function() {
		resetRotationSelection()
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
						$('.swatch').removeClass('active')
						$(this).addClass('active')
					})
		if(i == 0) $swatch.addClass('active');
	}



});
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
};/**
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
};
rotationTool = new Tool();
var rotationSpeed = 2

var currentItem, crosshair;
rotationTool.onMouseDown = function(event) {
	currentItem = getSelected()[0]
	if(currentItem == undefined) {
		hitResult = project.hitTest(event.point, {
			fill: true,
			tolerance: 5
		})
		
		if(!hitResult) return false;
		currentItem = hitResult.item			
	}
	selectOnly(currentItem);

	var d = 7
	var line1 = new Path.Line([d, 0], [d, 2*d])
	var line2 = new Path.Line([0, d], [2*d, d])
	var circle = new Path.Circle([d, d], d)
	circle.fillColor = 'white'

	crosshair = new Group([circle, line1, line2])
	crosshair.strokeColor = mainColor
	crosshair.position = event.point

	drawRotationRadius(currentItem, crosshair.position)
	stopRotating(currentItem)
}

rotationTool.onMouseDrag = function(event) {
	if(!currentItem) return;
	crosshair.position = crosshair.position.add(event.delta);
	drawRotationRadius(currentItem, crosshair.position)
}

rotationTool.onMouseUp = function() {
	if(!currentItem) return;
	// Start rotating
	var center = new Point(crosshair.position)
	rotate(currentItem, center)
	crosshair.remove()
};
/**
 * Selection tool
 *
 * The default and most important tool that selects, drags and edits items.
 * Depending on where the user clicks, the selection tool enters a different
 * *mode* (one of `selecting, editing, dragging`). The behaviour is determined
 * largely through the mode the selector is in.
 */

selectTool = new Tool()
var selectRect, handle, mode, cloned = false, currentItems = [];

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

		// We hit a handle --> edit selection
		if(isHandle(item)) {
			mode = 'editing'
			handle = item;
			currentItems = item.parent.items;
		}

		// We hit an object --> drag
		else {
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
		}
	} 

	// Nothing was hit; start a selection instead
	else {
		mode = 'selecting';
		currentItems = [];
		selectRect = new Path.Rectangle(event.point, new Size(0,0));
	}

	// Update the selection
	selectOnly(currentItems);

}

selectTool.onMouseDrag = function(event) {
	// Draw a rectangular selection region and select all the items
	// in that region when the mouse is released
	if(mode == 'selecting') {
		if(selectRect)
			selectRect.remove();
		selectRect = new Path.Rectangle(event.downPoint, event.point);
		selectRect.strokeColor = "#333"
		selectRect.dashArray = [2,3]
		selectRect.strokeWidth = 1
	}

	// Drag all the currently selected objects, following the movement
	// of the cursor.
	else if(mode == 'dragging') {

		if(Key.isDown('alt') && cloned == false) {
			// Clone & select current items
			currentItems = cloneSelection();
			selectOnly(currentItems)
			cloned = true;
		}

		moveItems(currentItems, event.delta)

		// for(var i=0; i<currentItems.length; i++) {
		// 	var item = currentItems[i], bbox = item.boundingBox;
		// 	item.position = item.position.add(event.delta)
		// 	bbox.position = bbox.position.add(event.delta)
			
		// 	// Move the focus point around which the current item rotates
		// 	if(isRotating(item))
		// 		item.focusPoint = item.focusPoint.add(event.delta);
		// }
	}

	// In editing mode we update the shape of the items based
	// on the current position of the cursor. Rectangles, circles
	// and groups are updated differently.
	else if(mode == 'editing') {
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
				var	newHandle = getHandleByName(newHandleName, item.boundingBox);
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
				var newHandle = item.boundingBox.children[1];
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

				// Update the selection box
				redrawBoundingBox(item);

				// Color selected handle
				var newHandleName = getPositionName(handle)
				var	newHandle = getHandleByName(newHandleName, item.boundingBox);
				newHandle.fillColor = mainColor
			}
		}

		// Multiple items currently selected --> group!
		else {
			// To do: scale
		}
	}
}

selectTool.onMouseUp = function(event) {
	
	if(mode == 'selecting') {

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

	}

	// Reset the mode
	mode = '';
	cloned = false;
}