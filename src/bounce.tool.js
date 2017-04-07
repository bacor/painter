
// bounceTool = new Tool();
// var bounceSpeed = 2

// var currentItem, startHandle, endHandle;
// bounceTool.onMouseDown = function(event) {
// 	currentItem = getSelected()[0]
// 	if(currentItem == undefined) {
// 		hitResult = project.hitTest(event.point, {
// 			fill: true,
// 			tolerance: 5
// 		})
		
// 		if(!hitResult) return false;
// 		currentItem = hitResult.item			
// 	}
// 	selectOnly(currentItem);

// 	drawRotationRadius(currentItem, event.point)
// }

// bounceTool.onMouseDrag = function(event) {
// 	if(!currentItem) return;
// 	drawRotationRadius(currentItem, event.point)
// }

// bounceTool.onMouseUp = function(event) {
// 	if(!currentItem) return;
	
	
// 	var endPoint = new Point(event.point);
// 	var startPoint = new Point(currentItem.position);

// 	// corners = currentItem.boundingBox.children[0].segments;
// 	// startPoint = corners[0].point.add(corners[2].point).divide(2)
// 	bounce(currentItem, startPoint, endPoint)
// }