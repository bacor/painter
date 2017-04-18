/**
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