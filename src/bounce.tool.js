
bounceTool = new Tool();
var rotationSpeed = 2

var currentItem;
bounceTool.onMouseDown = function(event) {
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

	// Set up animation
	resetAnimation(currentItem)

	initAnimation(currentItem, 'bounce', {
		startPoint: currentItem.position,
		endPoint: new Point(event.point),
		speed: rotationSpeed,
		position: 0
	})

	drawAnimationHandles(currentItem)
}

bounceTool.onMouseDrag = function(event) {
	if(!currentItem) return;
	
	updateAnimationProperties(currentItem, {
		startPoint: currentItem.position,
		endPoint: new Point(event.point)
	})

	drawAnimationHandles(currentItem)
}

bounceTool.onMouseUp = function(event) {
	if(!currentItem) return;

	// Start rotating
	startAnimation(currentItem, 'bounce')
}


/**
 * Rotation animation
 *
 * This object defines the rotation animation.
 * @type {Object}
 */
animations.bounce = {}
var p;
// Animation iself: frame updates
animations.bounce.onFrame = function(event, item, props) {
	props.position += .01
	var trajectory = props.startPoint.subtract(props.endPoint)
	var relPos = (Math.sin((props.position + .5) * Math.PI) + 1) / 2;
	var newPoint = trajectory.multiply(relPos).add(props.endPoint);
	var delta = newPoint.subtract(item.position);
	
	// Move it!
	moveItems([item], delta)
}

// Reset
animations.bounce.onReset = function(item, props) {
	
}

// Called when the item is moved
animations.bounce.onMove = function(delta, item, props) {
	// to do 
}

// Draws the handles
animations.bounce.drawHandles = function(item, props) {
	var line, dot1, dot2, handles;
	
	line = new Path.Line(props.startPoint, props.endPoint)
	line.strokeColor = mainColor;
	line.strokeWidth = 1;
	
	dot1 = new Path.Circle(props.startPoint, 3)
	dot1.fillColor = mainColor;

	dot2 = dot1.clone();
	dot2.position = props.endPoint;

	handles = new Group([line, dot1, dot2]);
	return handles;
}