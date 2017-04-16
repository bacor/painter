
selectionTool = new Tool();

var selectRect;

selectionTool.onMouseDown = function(event) {
	currentItems = [];
	selectRect = new Path.Rectangle(event.point, new Size(0,0));
}

selectionTool.onMouseDrag = function(event) {
	if(selectRect)
		selectRect.remove();
	selectRect = new Path.Rectangle(event.downPoint, event.point);
	selectRect.strokeColor = "#333"
	selectRect.dashArray = [2,3]
	selectRect.strokeWidth = 1}

selectionTool.onMouseUp = function(event) {
	// Remove the selection region
	if(selectRect) selectRect.remove();

	// Find all items in the selection area
	rect = new Rectangle(event.downPoint, event.point)
	var items = project.activeLayer.getItems({ 
		overlapping: rect,
	
		// Don't match elements inside a group (the group will be selected already)
		match: function(item) { 
			return !isBoundingBox(item)
		}
	});

	// And select!
	select(items);
}