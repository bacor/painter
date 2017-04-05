

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