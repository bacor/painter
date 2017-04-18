/**
 * Rectangle tool
 * 
 * Draws rectangles
 */

(function(){
	var rectTool = new paper.Tool();
	var rectangle;

	rectTool.onMouseDown = function(event) {
		rectangle = new paper.Path.Rectangle(event.point, new paper.Size(0,0));
		rectangle.fillColor = P.getActiveSwatch();
	}

	rectTool.onMouseDrag = function(event) {
		color = rectangle.fillColor;
		rectangle.remove();
		rectangle = new paper.Path.Rectangle(event.downPoint, event.point);
		rectangle.fillColor = color;
		rectangle.opacity = .9;
	}

	rectTool.onMouseUp = function() {
		var artefact = new P.Artefact.Rectangle(rectangle)

		// History
		var undo = function() { artefact.destroy(); }
		var redo = function() { artefact.restore(); }
		P.history.registerState(undo, redo)
	}

	P.registerTool('rectangle', rectTool);
})()