/**
 * Clone tool: clones the selected elements. The tool is activated by the 
 * {@link P.tools.select} tool, when the `alt`-key is pressed down.
 * 
 * @name clone
 * @memberOf P.tools
 * @type {paper.Tool}
 */
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