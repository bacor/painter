
cloneTool = new paper.Tool();

var currentItems;
cloneTool.onMouseDown = function(event) {
	currentItems = P.getSelected();
	currentItems = cloneSelection();
}

cloneTool.onMouseDrag = function(event) {
	currentItems.mmap('move', [event.delta])
}

cloneTool.onMouseUp = function() {}