/**
 * @todo support for history redo/undo
 * @type {paper.Tool}
 */
manipulateTool = new paper.Tool();

manipulateTool.onMouseDown = function(event, artefacts, handle) {
}

manipulateTool.onMouseDrag = function(event, artefacts, handle) {	
	var artefact = artefacts[0];
	artefact.manipulate(event, handle);
}

manipulateTool.onMouseUp = function(event, artefacts, handle) {

}