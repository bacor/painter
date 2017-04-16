
/**
 * Circle tool
 *
 * Draws circles.
 */

circleTool = new Tool()
var circle;

circleTool.onMouseDown = function(event) {
	deselectAll()
	circle = new Path.Circle({
		center: event.point, 
		radius: 0,
		fillColor: getActiveSwatch()
	});
}

circleTool.onMouseDrag = function(event) {
	var color = circle.fillColor;
	var diff = event.point.subtract(event.downPoint)
	var radius = diff.length / 2
	circle.remove();
	circle = new Path.Circle({
		center: diff.divide(2).add(event.downPoint),
		radius: radius,
		opacity: .9,
		fillColor: color
	});
}

circleTool.onMouseUp = function(event) {
	circle.type = 'circle'
	setupItem(circle);

	// scope
	var circ = circle;
	var undo = function() {
		deselect(circ)
		circ.remove()
	}

	var redo = function() {
		project.activeLayer.addChild(circ);
	}

	P.History.registerState(undo, redo)
}