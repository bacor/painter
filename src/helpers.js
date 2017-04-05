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
}