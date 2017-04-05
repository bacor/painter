

/**
 * To do:
 * The selection tool and the drag tool should be merged
 * When nothing is selected, the tool should work as the current
 * selection tool. When something is selected AND you hit
 * that object, then you should drag it.
 * @type {Tool}
 */
selectTool = new Tool()
var selectRect;
var dragging = false;
selectTool.onMouseDown = function(event) {
	hitResult = project.hitTest(event.point, {
		segments: true,
		fill: true,
		tolerance: 5
	})

	if(hitResult) {
		if(hitResult.item.parent.className == 'Group') {
			var item = hitResult.item, group = item.parent;
			showBoundingBox(group)
			dragging = [group, group.boundingBox]
		}
		
		else if(hitResult.type == 'fill') {
			if(!hitResult.item.selected) {
				project.deselectAll()
				hitResult.item.selected = true
			}
			dragging = project.getItems({
				class: Path,
				selected: true
			})
		}

		else if(hitResult.type == 'segment') {
			var segment = hitResult.segment
			project.deselectAll()
			segment.selected = true
			dragging = [segment]
		}

	} else {
		project.deselectAll()
		selectRect = new Path.Rectangle(event.point, new Size(0,0));
	}
}

var circle;
selectTool.onMouseDrag = function(event) {
  if(dragging) {
  	if(dragging[0].className == 'Segment') {
			var segment = dragging[0],
					path = segment.path;

			// Resize while keeping rectangular shape
			if(segment.path.type == 'rectangle') {
				var idx = segment.index,
						prevIdx = (idx - 1) % path.segments.length,
						nextIdx = (idx + 1) % path.segments.length;
				if(prevIdx < 0) prevIdx = path.segments.length + prevIdx;
				var prev = path.segments[prevIdx]
				var next = path.segments[nextIdx]

				// Move adjacent segments
				if(prev.point.x == segment.point.x) {
					prev.point = prev.point.add(new Point(event.delta.x, 0))
					next.point = next.point.add(new Point(0, event.delta.y))
				} else {
					prev.point = prev.point.add(new Point(0, event.delta.y))
					next.point = next.point.add(new Point(event.delta.x, 0))
				}
				segment.point = segment.point.add(event.delta)
			}
			
			// Just change the radius!
			if(segment.path.type == 'circle') {
				var center = path.position,
						radius = path.bounds.width,
						newRadius = event.point.subtract(center).length * 2,
						scaleFactor = newRadius/radius;
				path.scale(scaleFactor)
			}

		// Dragging a full path
  	} else {
    	for(var i=0; i<dragging.length; i++) {
				var item = dragging[i]
				var pos = item.position.add(event.delta)
				item.position = pos
			}	
  	}
  } else {
  	if(selectRect)
  		selectRect.remove();
    selectRect = new Path.Rectangle(event.downPoint, event.point);
		selectRect.strokeColor = "#333"
		selectRect.dashArray = [2,3]
		selectRect.strokeWidth = 1
	}
}

selectTool.onMouseUp = function(event) {
	if(dragging) {
		dragging = false
	} else {
		if(selectRect) selectRect.remove();
		rect = new Rectangle(event.downPoint, event.point)

		var items = project.getItems({ 
			overlapping: rect,
			class: Path
		});

		for(var i=0; i<items.length; i++) {
			var item = items[i]
			if (item.parent.className != 'Group')
				item.selected = true;
		}
	}
	
}