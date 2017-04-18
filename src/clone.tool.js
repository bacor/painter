
(function() {
	var cloneTool = new paper.Tool();

	var currentItems;
	cloneTool.onMouseDown = function(event) {
		currentItems = P.actions.clone(P.getSelected());
	}

	cloneTool.onMouseDrag = function(event) {
		currentItems.mmap('move', [event.delta])
	}

	cloneTool.onMouseUp = function() {}

	P.registerTool('clone', cloneTool);
	
})()