

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
		// 

		if(currentItems.length == 1) {
			item = currentItems[0]

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
				// rectangle is essentially removed.
				newWidth  = Math.abs(segment.point.x - (sameY.point.x + event.delta.x))
				newHeight = Math.abs(segment.point.y - (sameX.point.y + event.delta.y))
				deltaX = (newWidth <= 3) ? 0 : event.delta.x;
				deltaY = (newHeight <= 3) ? 0 : event.delta.y;
				sameX.point   = sameX.point.add([deltaX, 0]);
				sameY.point   = sameY.point.add([0, deltaY]);
				segment.point = segment.point.add([deltaX, deltaY]);

				// Update bounding box
				reselect(item)

				// Color selected handle
				var newHandleName = getPositionName(segment);
				var	newHandle = getHandleByName(newHandleName, item.boundingBox);
				newHandle.fillColor = 'black'
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
				reselect(item);

				// Color the selected handle
				var newHandle = item.boundingBox.children[1];
				newHandle.fillColor = 'black';
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
				reselect(item);

				// Color selected handle
				var newHandleName = getPositionName(handle)
				var	newHandle = getHandleByName(newHandleName, item.boundingBox);
				newHandle.fillColor = 'black'
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
			match: function(item) { return !inGroup(item) }
		});

		// And select!
		select(items)

	}

	// Reset the mode
	mode = ''
}