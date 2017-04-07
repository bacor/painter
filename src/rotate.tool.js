
rotationTool = new Tool();
var rotationSpeed = 2

var currentItem, crosshair;
rotationTool.onMouseDown = function(event) {
	currentItem = getSelected()[0]
	if(currentItem == undefined) {
		hitResult = project.hitTest(event.point, {
			fill: true,
			tolerance: 5
		})
		
		if(!hitResult) return false;
		currentItem = hitResult.item			
	}
	selectOnly(currentItem);

	crosshair = getCrosshair()
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