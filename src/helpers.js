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
	if((isRectangular(item) || isGroup(item)) || item.className == 'Rectangle') {

		// Bounds around the item
		var bounds = (isGroup(item) || isRectangular(item)) ? item.bounds : item;

		// Determine the rectangle on which to base the bounding box. For a rectangular
		// path, this should be that very path (to get the index ordering right),
		// for others it doesn't matter, but it is convenient to instantiate a Path first
		var rect = isRectangular(item) ? item : new Path.Rectangle(bounds)
		
		// The border of the bounding box (expanded slightly)
		var border = new Path.Rectangle(rect.bounds.expand(12))
		border.strokeColor = 'black'
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
	if(items instanceof Array && items.length == 0) return false;
	if(items instanceof Array && items.length == 1 ) items = items[0]//items = [items];
	
	if( !(items instanceof Array) ) {
		// var item = items[0];

		// Only generate bounding box for unselected
		if(isSelected(items)) return items.boundingBox;

		var boundingBox = getBoundingBox(items);
		boundingBox.items = [items];
		items.boundingBox = boundingBox;
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
	return select(item)
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
	if(item.type == undefined) return false;
	return item.type.startsWith('handle');
}

function isSegment(item) {
	return item.className == 'Segment';
}

function getAdjacentSegments(segment) {
	var segments = segment.path.segments,
			sameX, sameY, cur;
	for(var i=0; i<segments.length; i++) {
		if(segments[i] == segment) continue;
		if(segments[i].point.x == segment.point.x) sameX = segments[i];
		if(segments[i].point.y == segment.point.y) sameY = segments[i];
	}
	return {sameX: sameX, sameY: sameY };
}

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

function getPositionIndex(item) {
	if(isHandle(item)) {
		return item.parent.children.indexOf(item) - 1;
	}

	if(isSegment(item)) {
		return item.path.segments.indexOf(item);
	}
}

function getSegmentByName(name, rectangle) {
	var bounds = rectangle.bounds,
			position = bounds[name];

	for(var i =0; i<rectangle.segments.length; i++) {
		var segment = rectangle.segments[i];
		if(position.equals(segment.point)) return segment;
	}
}

function getSegmentByIndex(index, rectangle) {
	return rectangle.segments[index]
}

function getSegmentByHandle(handle, item) {
	var item = (item == false) ? getHandleItems(handle) : item
	var index = getPositionIndex(handle),
			segment = getSegmentByIndex(index, item);
	return segment
}

function getHandleByName(name, boundingBox) {
	var handles = boundingBox.children.slice(1);
	for(var i=0; i<handles.length; i++){
		if(getPositionName(handles[i]) == name) return handles[i];
	}
}

function inGroup(item) {
	return isGroup(item.parent)
}


function getHandleItems(handle) {
	var items = handle.parent.items
	if(items.length == 1) return items[0];
	return items
}

function getHandleByType(boundingBox, type) {
	var handles = boundingBox.items.filter(function(handle) {
		return handle.type == type
	})
	if( handles.length == 0 ) return false;
	if( handles.length == 1) return handles[0];
	return handles;
}

function getClosestHandle(boundingBox, point) {

}

function getBoundingBoxBorder(boundingBox) {
	return boundingBox.children[0]
}

function hitGroup(hitResult) {
	return inGroup(hitResult.item)
}