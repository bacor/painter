manipulateTool = new Tool();

var currentItems, handle;

manipulateTool.onSwitch = function(event) {
	var item = currentItems[0];
	handle = item;
	currentItems = [item.parent.item];
}

manipulateTool.onMouseDrag = function(event) {
	if(currentItems.length == 1) {
			var item = currentItems[0];

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
				newWidth  = Math.abs(segment.point.x - (sameY.point.x + event.delta.x));
				newHeight = Math.abs(segment.point.y - (sameX.point.y + event.delta.y));
				deltaX = (newWidth <= 3) ? 0 : event.delta.x;
				deltaY = (newHeight <= 3) ? 0 : event.delta.y;
				sameX.point   = sameX.point.add([deltaX, 0]);
				sameY.point   = sameY.point.add([0, deltaY]);
				segment.point = segment.point.add([deltaX, deltaY]);

				// Update bounding box
				item.redrawBoundingBox();

				// Color selected handle
				var newHandleName = getPositionName(segment);
				var	newHandle = getHandleByName(newHandleName, item.bbox);
				newHandle.fillColor = mainColor;
			}

			// Circles are just scaled
			if( isCircular(item) ) {
				// To do: you can move the handle along with the mouse, 
				// that'd be nice!
				var center = item.position,
						radius = item.bounds.width,
						newRadius = event.point.subtract(center).length * 2 - 6,
						scaleFactor = newRadius/radius;
				item.scale(scaleFactor);
				item.redrawBoundingBox();

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
				item.scale(scaleFactor);
				item.bbox.children['shadow'].scale(scaleFactor);

				// Update the selection box
				item.redrawBoundingBox();

				// item.children.map(function(child) {
				// 	child.redrawBoundingBox(); 
				// })

				// Color selected handle
				var newHandleName = getPositionName(handle);
				var	newHandle = getHandleByName(newHandleName, item.bbox);
				newHandle.fillColor = mainColor;
			}
		}
}

manipulateTool.onMouseUp = function(event) {}