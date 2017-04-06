
rotationTool = new Tool();
var rotationSpeed = 2

var currentItem, crosshair;
rotationTool.onMouseDown = function(event) {

	// Find and select current item
	hitResult = project.hitTest(event.point, {
		fill: true,
		tolerance: 5
	})
	if(!hitResult) return false;
	currentItem = hitResult.item			
	selectOnly(currentItem);

	var d = 7
	var line1 = new Path.Line([d, 0], [d, 2*d])
	var line2 = new Path.Line([0, d], [2*d, d])
	var circle = new Path.Circle([d, d], d)
	circle.fillColor = 'white'

	crosshair = new Group([circle, line1, line2])
	crosshair.strokeColor = mainColor
	crosshair.position = event.point

	drawRotationRadius(currentItem, crosshair.position)
	stopRotating(currentItem)
}

rotationTool.onMouseDrag = function(event) {
	if(!currentItem) return;
	crosshair.position = crosshair.position.add(event.delta);
	drawRotationRadius(currentItem, crosshair.position)
}

rotationTool.onMouseUp = function() {
	if(!currentItem) return;
	// Start rotating
	var center = new Point(crosshair.position)
	rotate(currentItem, center)
	crosshair.remove()
}