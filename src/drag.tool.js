dragTool = new Tool();
var currentItems;


dragTool.onMouseDown = function(event) {}

dragTool.onMouseDrag = function(event) {
	moveItem(currentItems, event.delta)
}

dragTool.onMouseUp = function(event) {

	var undoDelta = new Point(event.downPoint.subtract(event.point))
	var redoDelta = new Point(event.point.subtract(event.downPoint))

	if(redoDelta.length > 1) {
		var items = currentItems;
		
		var undo = function() {
			moveItem(items, undoDelta);
		}
		
		var redo = function() {
			moveItem(items, redoDelta)
		}
		
		P.History.registerState(undo, redo);
	}
}