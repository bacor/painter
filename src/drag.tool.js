dragTool = new paper.Tool();

dragTool.onMouseDrag = function(event, artefacts) {
	artefacts.map(function(artefact) {
		artefact.move(event.delta);
	})
}

dragTool.onMouseUp = function(event, artefacts) {

	var undoDelta = new paper.Point(event.downPoint.subtract(event.point))
	var redoDelta = new paper.Point(event.point.subtract(event.downPoint))

	if(redoDelta.length > 1) {
		var artefacts;
		
		var undo = function() {
			artefacts.map(function(artefact) {
				artefact.move(undoDelta);
			})
		}
		
		var redo = function() {
			artefacts.map(function(artefact) {
				artefact.move(redoDelta);
			})
		}
		
		P.history.registerState(undo, redo);
	}
}