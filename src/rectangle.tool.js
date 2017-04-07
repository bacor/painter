/**
 * Rectangle tool
 * 
 * Draws rectangles
 */


rectTool = new Tool();
var rectangle;

rectTool.onMouseDown = function(event) {
	rectangle = new Path.Rectangle(event.point, new Size(0,0));
	rectangle.fillColor = getActiveSwatch()
}

rectTool.onMouseDrag = function(event) {
	color = rectangle.fillColor
	rectangle.remove()
	rectangle = new Path.Rectangle(event.downPoint, event.point);
	rectangle.fillColor = color
	rectangle.opacity = .9
}

rectTool.onMouseUp = function() {
	rectangle.type = 'rectangle'
}