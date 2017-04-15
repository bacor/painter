/**
 * Register the rotate animation 
 *
 * @return {null}
 */
(function() {
	
	// The animation object
	rotate = {}

	// Animation iself: frame updates
	rotate.onFrame = function(item, props, event) {
		item.rotate(props.speed, props.center);
		props.degree = ((props.degree || 0) + props.speed) % 360
	}

	// Reset
	rotate.onReset = function(item, props) {

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
	rotate.drawHandles = function(item, props) {
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

	// Transform the center point
	rotate.onTransform = function(item, props, matrix) {
		props.center = props.center.transform(matrix)
	}

	rotate.onUpdate = function(item, props, event) {
		props.center = new Point(event.point);
	}

	// Register!
	registerAnimation('rotate', rotate, { speed: 2 })

})()