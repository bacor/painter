
cloneTool = new Tool();

var currentItems;
cloneTool.onMouseDown = function(event) {
	currentItems = getSelected();
	currentItems = cloneSelection();
	selectOnly(currentItems)
}

cloneTool.onMouseDrag = function(event) {
	moveItem(currentItems, event.delta)
}

cloneTool.onMouseUp = function() {}