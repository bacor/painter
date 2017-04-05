;/**
 * helpers.js
 *
 * This file contains various helpers
 */

function getHandle(position) { 
	var handle = new Path.Circle({
		center: position, 
		radius: 4,
		strokeColor: '#333',
		fillColor: 'white'
	})

	handle.on('mouseenter', function() {
		this.fillColor = 'black'
	})

	handle.on('mouseleave', function() {
		this.fillColor = 'white'
	})

	handle.type = 'handle'

	return handle
}

function getBoundingBox(item) {
	var parts = []

	// Rectangles, groups or an array of multiple items 
	// all get a rectangular bounding box
	if(isGroup(item) || isRectangular(item) || item.className == 'Rectangle') {
		
		var bounds = (isRectangular(item) || isGroup(item)) ? item.bounds : item;
		var border = new Path.Rectangle(bounds.expand(12))
		border.strokeColor = 'black'
		parts.push(border)

		positions = ['topLeft', 'bottomLeft', 'bottomRight', 'topRight']
		for(var i =0; i<positions.length; i++) {
			var position = border.bounds[positions[i]]
			var handle = getHandle(position)
			handle.type = 'handle:' + positions[i]
			parts.push(handle)
		}
	}

	// Circles get a circular bounding box
	if(isCircular(item)) {

		var radius = (item.bounds.width + 12) / 2
		var center = item.position 
		var border = new Path.Circle(item.position, radius)
		border.strokeColor = 'black'
		var handle = getHandle([center.x + radius, center.y])
		parts.push(border)
		parts.push(handle)
	}

	var boundingBox = new Group(parts)
	boundingBox.type = 'boundingBox'
	return boundingBox
}

function select(items) {
	if( !(items instanceof Array) ) items = [items];
	if(items.length == 0) return false;
	
	if(items.length == 1) {
		var item = items[0];

		// Only generate bounding box for unselected
		if(isSelected(item)) return item.boundingBox;

		var boundingBox = getBoundingBox(item);
		boundingBox.items = [item];
		item.boundingBox = boundingBox;
	}

	else if(items.length > 1) {

		// Get bounding box of all items together
		var bounds = items[0].bounds;
		for(var i=1; i<items.length; i++){
			bounds = bounds.unite(items[i].bounds);
		}

		// The bounding box
		var boundingBox = getBoundingBox(bounds);
		boundingBox.items = items;

		// Refer from items to bounding box
		for(var i=0; i<items.length; i++){
			items[i].boundingBox = boundingBox;
			items[i].strokeColor = 'black';
		}
	}

	return boundingBox;
}

function deselect(item) {
	item.boundingBox.remove();
	item.boundingBox = undefined;
	item.strokeColor = undefined;
}

function reselect(item){
	deselect(item)
	select(item)
}

function deselectAll(items) {
	var items = project.getItems({
		match: isSelected
	})

	for(var i=0; i<items.length;i++) {
		deselect(items[i])
	}
}

function isSelected(item) {
	return item.boundingBox != undefined
}

function isBoundingBox(item) {
	return item.type == 'boundingBox'
}

function isRectangular(item) {
	return item.className == 'Path' && item.type == 'rectangle'
}

function isCircular(item) {
	return item.className == 'Path' && item.type == 'circle'
}

function isGroup(item) {
	return item.className == 'Group'
}

function isHandle(item) {
	return item.type.startsWith('handle')
}

function handlePosition(handle, index=false) {
	positions = ['bottomLeft', 'topLeft', 'topRight', 'bottomRight']
	for(var i =0; i<positions.length; i++) {
		if(handle.type.endsWith(positions[i])) {
			if(index == true) return i;
			return positions[i]
		}	
	}
} 

function inGroup(item) {
	return isGroup(item.parent)
}

function getHandleItems(handle) {
	return handle.parent.items
}

function hitGroup(hitResult) {
	return inGroup(hitResult.item)
};/**
 * Painter.js
 */

paper.install(window);

function groupSelection() {
	var items = project.getItems({
		match: isSelected
	})
	var group = new Group(items);
	group.type = 'group'
	group.fillColor = group.children[0].fillColor
	deselectAll()
	select(group)
}

$(window).ready(function() {

	paper.setup('canvas');

	function onKeyDown(event) {
		if(event.key == 'backspace') {
			items = project.getItems({
				match: isSelected
			})
			for(var i=0; i<items.length;i++) {
				deselect(items[i])
				items[i].remove()
			}
		}

		if(event.key == 'space') {
			items = project.getItems({
				class: Path,
				selected: true
			})
			bound(items);

		}
	}

	rectTool.onKeyDown = onKeyDown;
	circleTool.onKeyDown = onKeyDown;
	selectTool.onKeyDown = onKeyDown;

	// Demo
	r = new Path.Rectangle([20,30,100,140])
	r.fillColor = 'red'
	// r.selected = true
	r.type = 'rectangle'

	c = new Path.Circle([300,100], 40)
	c.fillColor = 'green'
	// c.selected = true
	c.type = 'circle'

	$('a.tool[data-tool=rectangle]').on('click', function() {
		rectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=circle]').on('click', function() {
		circleTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=select]').on('click', function() {
		selectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=group]').on('click', function() {
		groupSelection()
	})

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
		fillColor: {
			hue: Math.random() * 360,
			saturation: .7,
			brightness: .8
		}
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
};// /**
//  * Rectangle tool
//  * 
//  * Draws rectangles
//  */


rectTool = new Tool();
var rectangle;

rectTool.onMouseDown = function(event) {
	rectangle = new Path.Rectangle(event.point, new Size(0,0));
	rectangle.fillColor = {
		hue: Math.random() * 360,
		saturation: .7,
		brightness: 1
	}
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

/**
 * To do:
 * The selection tool and the drag tool should be merged
 * When nothing is selected, the tool should work as the current
 * selection tool. When something is selected AND you hit
 * that object, then you should drag it.
 * @type {Tool}
 */
selectTool = new Tool()
var selectionTool = new Tool()
var selectRect;
var mode = 'selecting'; // selecting / dragging
var handle;
var currentItems;

selectTool.onMouseDown = function(event) {
	
	// Test if we hit an item
	hitResult = project.hitTest(event.point, {
		fill: true,
		tolerance: 5
	})

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

			// Select the group if the item we hit is in a group
			if(inGroup(item)) item = item.parent;
			
			// Deselect the other items either if the current target is not 
			// selected or if there is no group of items selected (i.e., just one)
			if(!isSelected(item) 
				|| (isSelected(item) && item.boundingBox.items.length == 1)) {
				deselectAll()
			} 
			select(item)
			mode = 'dragging'
			currentItems = item.boundingBox.items
		}
	} 

	// Nothing was hit; start a selection instead
	else {
		mode = 'selecting'
		deselectAll()
		selectRect = new Path.Rectangle(event.point, new Size(0,0));
	}
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
		for(var i=0; i<currentItems.length; i++) {
			var item = currentItems[i]
			item.position = item.position.add(event.delta)
		}

		// All items share one bounding box; so update its position only once
		boundingBox = currentItems[0].boundingBox	
		boundingBox.position = boundingBox.position.add(event.delta)
	}

	// In editing mode we update the shape of the items based
	// on the current position of the cursor. Rectangles, circles
	// and groups are updated differently.
	else if(mode == 'editing') {

		// to do 

		if(currentItems.length == 1) {
			item = currentItems[0]
			
			// Rectangle!
			if( isRectangular(item) ) {
				var idx = handlePosition(handle, true),
						prevIdx = (idx + 1) % 4,
						nextIdx = (idx - 1) % 4;
				if(nextIdx < 0) nextIdx = 4 + nextIdx;
				var cur  = item.segments[idx]
				var prev = item.segments[prevIdx]
				var next = item.segments[nextIdx]

				// Move adjacent segments
				if(prev.point.x == cur.point.x) {
					prev.point = prev.point.add(new Point(event.delta.x, 0))
					next.point = next.point.add(new Point(0, event.delta.y))
				} else {
					prev.point = prev.point.add(new Point(0, event.delta.y))
					next.point = next.point.add(new Point(event.delta.x, 0))
				}
				cur.point = cur.point.add(event.delta)
				reselect(item)
			}

			// Circles and groups can just be scaled
			// @todo: for groups, the scaling should be such that the
			// cursor stays on the handles. That doesn't happen now.
			if( isCircular(item) || isGroup(item) ) {
				// To do: you can move the handle along with the mouse, 
				// that'd be nice!
				var center = item.position,
						radius = item.bounds.width,
						newRadius = event.point.subtract(center).length * 2 - 6,
						scaleFactor = newRadius/radius;
				item.scale(scaleFactor)
				reselect(item);
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
		// @todo You cannot select groups using the rectangular
		// selection. That should be fixed.
		rect = new Rectangle(event.downPoint, event.point)
		var items = project.getItems({ 
			overlapping: rect,
			class: Path,
			match: function(item) { // Does this work? Or use filter instead?
				return !inGroup(item)
			}
		});

		// And select!
		select(items)

	}

	// Reset the mode
	mode = ''
}