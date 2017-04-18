/**
 * Tool for manipulating artefacts. It is activated by {@link P.tools.select}
 * when the user hit one of the artefacts handles. When the mouse is then 
 * dragged, {@link Artefact.manipulate} is called to perform the actual
 * manipulation.
 *
 * @name manipulate
 * @memberOf P.tools
 * @todo support for history redo/undo
 * @type {paper.Tool}
 */
(function() {
	var manipulateTool = new paper.Tool();

	manipulateTool.onMouseDown = function(event, artefacts, handle) {
	}

	manipulateTool.onMouseDrag = function(event, artefacts, handle) {	
		var artefact = artefacts[0];
		artefact.manipulate(event, handle);
	}

	manipulateTool.onMouseUp = function(event, artefacts, handle) {
	}

	P.registerTool('manipulate', manipulateTool)
})()