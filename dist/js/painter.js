;/**
 * helpers.js
 *
 * This file contains various helpers
 */


function setupItem(item) {
	item.animation = undefined;
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
		if(isGroup(item)) border.dashArray = [5,2];
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
	if(!item || isSelected(item)) return;
	showBoundingBox(item)

	if(hasAnimation(item))
		drawAnimationHandles(item);

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
	removeAnimationHandles(item);
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

/**
 * Tests if a group has been hit
 * @param  {HitResult} hitResult 
 * @return {Boolean}
 */
function hitGroup(hitResult) {
	return inGroup(hitResult.item)
}

function hasAnimation(item, type=false) {
	if(item.animation == undefined) return false; 
	if(item.animation.type == undefined) return false;
	if(type) return item.animation.type == type;
	return true;
}

function isAnimating(item, type=false) {
	return hasAnimation(item, type) && item.animation.active == true;
} 

/**
 * Test if an item is rotating
 * @param  {Item}  item 
 * @return {Boolean}    
 */
function isRotating(item) {
	return isAnimating(item, 'rotate')
	// return hasAnimation(item, 'rotate') && item.animation.active == true;
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

function moveItem(item, delta) {
	if(item instanceof Array) return item.map(function(i) { moveItem(i, delta) });

	// Move the item
	item.position = item.position.add(delta);

	// If this is a group, move all animating children as well
	if(isGroup(item)) moveAnimation(item.children, delta);

	// Bounding box, only if it exists
	var bbox = item.bbox;
	if(bbox) bbox.position = bbox.position.add(delta);
	
	// Update the animations
	moveAnimation(item, delta)
}

function moveAnimation(item, delta) {
	if(item instanceof Array) item.map(function(i){ moveAnimation(i, delta) });
	if(!hasAnimation(item)) return false;

	var type = item.animation.type; 
	var properties = item.animation.properties;

	var onMove = animations[type].onMove || function(){};
	onMove(delta, item, properties);

	if(isSelected(item)) drawAnimationHandles(item);
}
;
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
function startAnimation(item, type=false) {
	if(item instanceof Array) 
		return item.map(function(i) { startAnimation(i, type) });
	if(!hasAnimation(item, type)) 
		return false;
	
	var type = type || item.animation.type;
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
;/**
 * Painter.js
 */

paper.install(window);

// function onFrame() {
// 	var items = project.getItems()
// 	console.log(items)
// 	for(var i=0;i>items.length; i++){
// 		showBoundingBox(items[i])
// 	}
// }

var mainColor = '#78C3D0';

function groupSelection() {
	
	var items = getSelected();
	resetAnimation(items)
	var group = new Group(items);
	group.type = 'group'

	// console.log(group.bounds, group.bounds.center)
	// corners = group.bbox.children[0].segments;
	// middle = corners[0].point.add(corners[2].point).divide(2)
	group.pivot = new Point(group.bounds.center);

	setupItem(group);
	selectOnly(group)
	startAnimation(items)
}

function ungroupSelection() {
	// Get all currently selected groupos
	var groups = project.getItems({
		class: Group,
		match: isSelected
	})
	ungroup(groups)
}

/**
 * See https://github.com/paperjs/paper.js/issues/1026
 * @param  {Group} group 
 * @return {Array}       Children
 */
function ungroup(group) {
	if(group instanceof Array) return group.map(ungroup);

	resetAnimation(group)
	children = group.removeChildren();
	group.parent.insertChildren(group.index,  children);
	deselect(group);
	group.remove();

	// resetAnimation(children)
	select(children)
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

		else if(event.key == 'b') {
			$('a.tool[data-tool=bounce]').click();	
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
	bounceTool.onKeyDown = onKeyDown;

	// Demo
	r = new Path.Rectangle([20,30,100,140])
	r.fillColor = getColor(0, 7)
	// r.selected = true
	r.type = 'rectangle'
	setupItem(r)
	c = new Path.Circle([300,100], 40)
	c.fillColor = getColor(1, 7)
	// c.selected = true
	c.type = 'circle'
	setupItem(c)
	select(c)
	select(r)
	groupSelection()
	deselectAll()


		// Demo
	r = new Path.Rectangle([200,200,100,140])
	r.fillColor = getColor(3, 7)
	// r.selected = true
	r.type = 'rectangle'
	setupItem(r)

	c = new Path.Circle([500,300], 40)
	c.fillColor = getColor(4, 7)
	// c.selected = true
	c.type = 'circle'
	setupItem(c)
	// select(c)
	select(r)

	// rotate(c, new Point([100,100]))
	// rotate()


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
	})

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
			startAnimation(getSelected());
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')

		} else {
			stopAnimation(getSelected());
			$(this).find('span').html('play <code>space</code>')
			$(this).data('state', 'play')
		}
	})

	$('a.tool[data-tool=rotate]').on('click', function() {
		rotationTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=bounce]').on('click', function() {
		bounceTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=reset]').on('click', function() {
		resetAnimation(getSelected(), 'rotate');
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
						$('.swatch').removeClass('active');
						$(this).addClass('active');
						changeColorSelection();
					})
		if(i == 0) $swatch.addClass('active');
	}



});
bounceTool = new Tool();
var rotationSpeed = 2

var currentItem;
bounceTool.onMouseDown = function(event) {
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

	// Set up animation
	resetAnimation(currentItem)

	initAnimation(currentItem, 'bounce', {
		startPoint: currentItem.position,
		endPoint: new Point(event.point),
		speed: rotationSpeed,
		position: 0
	})

	drawAnimationHandles(currentItem)
}

bounceTool.onMouseDrag = function(event) {
	if(!currentItem) return;
	
	corners = currentItem.bbox.children[0].segments;
	middle = corners[0].point.add(corners[2].point).divide(2)
	
	updateAnimationProperties(currentItem, {
		startPoint: middle,
		endPoint: new Point(event.point)
	})

	drawAnimationHandles(currentItem)
}

bounceTool.onMouseUp = function(event) {
	if(!currentItem) return;

	// Start rotating
	startAnimation(currentItem, 'bounce')
}


/**
 * Rotation animation
 *
 * This object defines the rotation animation.
 * @type {Object}
 */
animations.bounce = {}
var p;
// Animation iself: frame updates
animations.bounce.onFrame = function(event, item, props) {
	props.position += .01
	var trajectory = props.startPoint.subtract(props.endPoint)
	var relPos = (Math.sin((props.position + .5) * Math.PI) + 1) / 2;
	var newPoint = trajectory.multiply(relPos).add(props.endPoint);
	var delta = newPoint.subtract(item.position);
	
	// Move it!
	moveItem(item, delta)
	
	// The start & endpoint are also moved in onMove so the item becomes
	// draggable. But for the animation we should keep the start & endpoint
	// fixed. So we undo what onMove does:
	props.startPoint = props.startPoint.subtract(delta)
	props.endPoint = props.endPoint.subtract(delta)
}

// Reset
animations.bounce.onReset = function(item, props) {
	item.position = props.startPoint.add(props.position)
	props.position = 0;
}

// Called when the item is moved
animations.bounce.onMove = function(delta, item, props) {
	props.startPoint = props.startPoint.add(delta)
	props.endPoint = props.endPoint.add(delta)
}

// Draws the handles
animations.bounce.drawHandles = function(item, props) {
	var line, dot1, dot2, handles;
	
	line = new Path.Line(props.startPoint, props.endPoint)
	line.strokeColor = mainColor;
	line.strokeWidth = 1;
	
	dot1 = new Path.Circle(props.startPoint, 3)
	dot1.fillColor = mainColor;

	dot2 = dot1.clone();
	dot2.position = props.endPoint;

	handles = new Group([line, dot1, dot2]);
	return handles;
};
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
	setupItem(circle);
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
	setupItem(rectangle);
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

	// Set up animation
	resetAnimation(currentItem)

	initAnimation(currentItem, 'rotate', {
		center: new Point(event.point),
		speed: rotationSpeed,
		degree: 0
	})

	drawAnimationHandles(currentItem)
}

rotationTool.onMouseDrag = function(event) {
	if(!currentItem) return;
	
	updateAnimationProperties(currentItem, {
		center: new Point(event.point),
	})

	drawAnimationHandles(currentItem)
}

rotationTool.onMouseUp = function(event) {
	if(!currentItem) return;

	// Start rotating
	startAnimation(currentItem, 'rotate')
}



/**
 * Rotation animation
 *
 * This object defines the rotation animation.
 * @type {Object}
 */
animations.rotate = {}

// Animation iself: frame updates
animations.rotate.onFrame = function(event, item, props) {
	item.rotate(props.speed, props.center);
	item.bbox.rotate(props.speed, props.center);
	props.degree = ((props.degree || 0) + props.speed) % 360
}

// Reset
animations.rotate.onReset = function(item, props) {

	// Rotate the item back to its original position
	var deg = - props.degree
	item.rotate(deg, props.center)
	item.bbox.rotate(deg, props.center);
	props.degree = 0;

	// The path might not be exactly rectangular anymore due to the 
	// rotation. Rounding the coordinates solves the problem.
	if(isRectangular(item)) {
		item.segments.map(function(segment) {
			segment.point.x = Math.round(segment.point.x)
			segment.point.y = Math.round(segment.point.y)
		})
	}
}
var p;

// Called when the item is moved
animations.rotate.onMove = function(delta, item, props) {
	props.center = props.center.add(delta)
}

// Draws the handles
animations.rotate.drawHandles = function(item, props) {
	var border, tl, br, middle, line, dot, handles;

	// Determine the middle of the bounding box: average of two opposite corners
	corners = item.bbox.children[0].segments;
	middle = corners[0].point.add(corners[2].point).divide(2)
	
	line = new Path.Line(middle, props.center)
	line.strokeColor = mainColor;
	line.strokeWidth = 1;
	
	dot = new Path.Circle(props.center, 3)
	dot.fillColor = mainColor;
	dot.position = props.center;

	handles = new Group([line, dot]);
	return handles;
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

		// Animation handle: skip
		if(isAnimationHandle(item)){ 
			return 
		}
		
		// We hit a handle --> edit selection
		else if(isHandle(item)) {
			mode = 'editing'
			handle = item;
			currentItems = [item.parent.item];
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

		moveItem(currentItems, event.delta)
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
				var	newHandle = getHandleByName(newHandleName, item.bbox);
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
				var newHandle = item.bbox.children[1];
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
				var	newHandle = getHandleByName(newHandleName, item.bbox);
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