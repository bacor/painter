
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

	// Set up animation
	initAnimation(currentItem, 'rotate', {
		center: new Point(event.point),
		speed: rotationSpeed,
		degree: 0
	})
}

rotationTool.onMouseDrag = function(event) {
	if(!currentItem) return;
	
	// Update the center
	updateAnimationProperties(currentItem, {
		center: new Point(event.point),
	})
}

rotationTool.onMouseUp = function(event) {
	if(!currentItem) return;

	// Start rotating
	startAnimation(currentItem, 'rotate')
}



/**
 * Rotation animation
 *
 * This object defines the rotation animation.
 * @type {Object}
 */
animations.rotate = {}

// Animation iself: frame updates
animations.rotate.onFrame = function(event, item, props) {
	item.rotate(props.speed, props.center);
	props.degree = ((props.degree || 0) + props.speed) % 360
}

// Reset
animations.rotate.onReset = function(item, props) {

	// Rotate the item back to its original position
	var deg = - props.degree
	item.rotate(deg, props.center)
	props.degree = 0;

	// The path might not be exactly rectangular anymore due to the 
	// rotation. Rounding the coordinates solves the problem.
	if(isRectangular(item)) {
		item.segments.map(function(segment) {
			segment.point.x = Math.round(segment.point.x)
			segment.point.y = Math.round(segment.point.y)
		})
	}
}

// Draws the handles
animations.rotate.drawHandles = function(item, props) {
	var border, tl, br, middle, line, dot, handles;

	// Determine the middle of the bounding box: average of two opposite corners
	corners = item.bbox.children[0].segments;
	middle = corners[0].point.add(corners[2].point).divide(2)
	
	line = new Path.Line(middle, props.center)
	line.strokeColor = mainColor;
	line.strokeWidth = 1;
	
	dot = new Path.Circle(props.center, 3)
	dot.fillColor = mainColor;
	dot.position = props.center;

	handles = new Group([line, dot]);
	return handles;
}

animations.rotate.onTransform = function(item, matrix, props) {
	props.center = props.center.transform(matrix)
}