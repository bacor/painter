/**
 * Rotation animation, allows the user to rotate an artefact around
 * a specified point.
 *
 * @name rotate
 * @memberOf P.animations
 * @type {Object}
 */
(function() {
	
	// The animation object
	rotate = {}

	// Animation iself: frame updates
	rotate.onFrame = function(artefact, props, event) {
		artefact.item.rotate(props.speed, props.center);
		props.degree = ((props.degree || 0) + props.speed) % 360
	}

	// Reset
	rotate.onStop = function(artefact, props) {

		// Rotate the item back to its original position
		var deg = - props.degree
		artefact.item.rotate(deg, props.center)
		props.degree = 0;

		// The path might not be exactly rectangular anymore due to the 
		// rotation. Rounding the coordinates solves the problem.
		if(artefact.isRectangle()) {
			artefact.item.segments.map(function(segment) {
				segment.point.x = Math.round(segment.point.x)
				segment.point.y = Math.round(segment.point.y)
			})
		}
	}

	// Draws the handles
	rotate.onDrawHandles = function(artefact, props) {
		var line, dot, handles;

		// Determine the middle of the bounding box: average of two opposite corners
		corners = artefact.bbox.children['border'].segments;
		middle = corners[0].point.add(corners[2].point).divide(2);
		
		line = new paper.Path.Line(middle, props.center)
		line.strokeColor = P.mainColor;
		line.strokeWidth = 1;
		
		dot = new paper.Path.Circle(props.center, 3)
		dot.fillColor = P.mainColor;
		dot.position = props.center;

		handles = new paper.Group([line, dot]);
		return handles;
	}

	// Transform the center point
	rotate.onTransform = function(artefact, props, matrix) {
		props.center = props.center.transform(matrix)
	}

	rotate.onUpdate = function(artefact, props, event) {
		props.center = new paper.Point(event.point);
	}

	// Register!
	P.registerAnimation('rotate', rotate, { speed: 2 })

})()