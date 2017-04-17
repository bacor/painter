
/**
 * Circle tool
 *
 * Draws circles.
 */

circleTool = new paper.Tool()
var circle, radius, center;

circleTool.onMouseDown = function(event) {
	P.deselectAll()
	circle = new paper.Path.Circle({
		center: event.point, 
		radius: 0,
		fillColor: P.getActiveSwatch()
	});
}

circleTool.onMouseDrag = function(event) {
	var color = circle.fillColor;
	var diff = event.point.subtract(event.downPoint)
	radius = diff.length / 2
	center = diff.divide(2).add(event.downPoint)
	circle.remove();
	circle = new Path.Circle({
		center: center,
		radius: radius,
		opacity: .9,
		fillColor: color
	});
}

circleTool.onMouseUp = function(event) {

	// Initialize artefact
	var artefact = new P.Artefact.Circle(center, radius);
	artefact.item.fillColor = circle.fillColor
	circle.remove();
	
	// History
	var undo = function() { artefact.destroy(); }
	var redo = function() { artefact.restore(); }
	P.history.registerState(undo, redo)
}