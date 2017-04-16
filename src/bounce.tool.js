/**
 * Register the bounce animation
 * @return {null}
 */
(function() {

	/**
	 * Rotation animation
	 *
	 * This object defines the rotation animation.
	 * @type {Object}
	 */
	var bounce = {}

	// Animation iself: frame updates
	bounce.onFrame = function(item, props, event) {
		props.position += .01
		var trajectory = props.startPoint.subtract(props.endPoint)
		var relPos = (Math.sin((props.position + .5) * Math.PI) + 1) / 2;
		var newPoint = trajectory.multiply(relPos).add(props.endPoint);
		var delta = newPoint.subtract(item.position);
		
		// Move it!
		item.position = item.position.add(delta)
	}

	// Reset
	bounce.onStop = function(item, props) {
		item.position = props.startPoint.add(props.position)
		props.position = 0;
	}

	// Draws the handles
	bounce.onDrawHandles = function(item, props) {
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

	bounce.onTransform = function(item, props, matrix) {
		props.startPoint = props.startPoint.transform(matrix)
		props.endPoint = props.endPoint.transform(matrix)
	}

	bounce.onClone = function(copy, props) {
		props.startPoint = getCenter(copy);
		return props;
	}

	bounce.onUpdate = function(item, props, event) {
		props.startPoint = getCenter(item);
		props.endPoint = new Point(event.point);
	}

	// Register the animation
	P.registerAnimation('bounce', bounce, { speed: 2, position: 0 })

})()