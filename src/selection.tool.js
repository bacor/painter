
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
		match: function(item) { 
			return item.isArtefact()
		}
	});
	console.log(items)

	// If we put this in the match, it doesn't work?
	items = items.filter(function(item) { return !inGroup(item) })
	console.log(items)

	// And select!
	select(items);
}