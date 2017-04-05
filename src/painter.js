/**
 * Painter.js
 */

paper.install(window);

$(window).ready(function() {

	paper.setup('canvas');

	
	// To do: on selection, show outline around 
	function groupSelection() {
		var items = project.getItems({
			class: Path,
			selected: true
		})
		var group = new Group(items);

		group.fillColor = group.children[0].fillColor
	 	group.selected = false
	 	showBoundingBox(group)
	}

	function onKeyDown(event) {
		if(event.key == 'backspace') {
			items = project.getItems({
				class: Path,
				selected: true
			})
			for(var i=0; i<items.length;i++) {
				items[i].remove()
			}
		}
	}

	function showBoundingBox(group) {
		if(!group.boundingBox) {
			bounds = group.bounds.expand([5,5])
			group.boundingBox = new Path.Rectangle(bounds)
		}
		group.boundingBox.selected = true
	}

	function hideBoundingBox(group) {
		if(group.boundingBox) 
			group.boundingBox.remove()
	}

	rectTool.onKeyDown = onKeyDown;
	circleTool.onKeyDown = onKeyDown;
	selectTool.onKeyDown = onKeyDown;

	// Demo
	r = new Path.Rectangle([20,30,100,140])
	r.fillColor = 'red'
	r.selected = true
	r.type = 'rectangle'

	c = new Path.Circle([300,100], 40)
	c.fillColor = 'green'
	c.selected = true
	c.type = 'circle'

	$('a.tool[data-tool=rectangle]').on('click', function() {
		rectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=circle]').on('click', function() {
		circleTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=select]').on('click', function() {
		selectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=group]').on('click', function() {
		groupSelection()
	})

})

// /**
//  * Painter.js
//  */

// paper.install(window);
// // Keep global references to both tools, so the HTML
// // links below can access them.
// var rectTool, circleTool, selectTool, dragTool;

// $(window).ready(function() {

// 	paper.setup('canvas');

// 	rectTool = new Tool();
// 	var rectangle;

// 	rectTool.onMouseDown = function(event) {
// 		rectangle = new Path.Rectangle(event.point, new Size(0,0));
// 		rectangle.fillColor = {
// 			hue: Math.random() * 360,
// 			saturation: .7,
// 			brightness: 1
// 		}
// 	}

// 	rectTool.onMouseDrag = function(event) {
// 		color = rectangle.fillColor
//     rectangle.remove()
//     rectangle = new Path.Rectangle(event.downPoint, event.point);
//     rectangle.fillColor = color
//     rectangle.opacity = .9
// 	}

// 	circleTool = new Tool()
// 	var circle;

// 	circleTool.onMouseDown = function(event) {
// 		circle = new Path.Circle({
// 			center: event.point, 
// 			radius: 0,
// 			fillColor: {
// 				hue: Math.random() * 360,
// 				saturation: .7,
// 				brightness: .8
// 			}
// 		});
// 	}

// 	circleTool.onMouseDrag = function(event) {
// 		// todo: this is not the illustrator-type behaviour. 
// 		// Is that a problem?
// 		var color = circle.fillColor;
// 		var diff = event.point.subtract(event.downPoint)
// 		var radius = diff.length / 2
// 		circle.remove();
// 		circle = new Path.Circle({
// 			center: diff.divide(2).add(event.downPoint),
// 			radius: radius,
// 			opacity: .9,
// 			fillColor: color
// 		});
// 	}

// 	/**
// 	 * To do:
// 	 * The selection tool and the drag tool should be merged
// 	 * When nothing is selected, the tool should work as the current
// 	 * selection tool. When something is selected AND you hit
// 	 * that object, then you should drag it.
// 	 * @type {Tool}
// 	 */
// 	selectTool = new Tool()
// 	var rectangle;

// 	selectTool.onMouseDown = function(event) {
// 		project.deselectAll()
// 		rectangle = new Path.Rectangle(event.point, new Size(0,0));
// 	}

// 	selectTool.onMouseDrag = function(event) {
//     rectangle.remove()
//     rectangle = new Path.Rectangle(event.downPoint, event.point);
// 		rectangle.strokeColor = "blue"
// 		rectangle.dashArray = [2,4]
// 		rectangle.strokeWidth = 1.5
// 	}

// 	selectTool.onMouseUp = function(event) {
// 		rectangle.remove();
// 		rect = new Rectangle(event.downPoint, event.point)

// 		var items = project.getItems({ 
// 			overlapping: rect,
// 			class: Path
// 		});

// 		for(var i=0; i<items.length; i++) {
// 			items[i].selected = true
// 		}
// 	}

// 	dragTool = new Tool()
// 	var draggingItems = [];
// 	dragTool.onMouseDown = function(event) {
// 		draggingItems = project.getItems({
// 			class: Path,
// 			selected: true
// 		})
// 	}

// 	dragTool.onMouseDrag = function(event) {
// 		for(var i=0; i<draggingItems.length; i++) {
// 			var item = draggingItems[i]
// 			var pos = item.position.add(event.delta)
// 			item.position = pos
// 		}
// 	}

// 	// To do: on selection, show outline around 
// 	function groupSelection() {
// 		var items = project.getItems({
// 			class: Path,
// 			selected: true
// 		})
// 		var group = new Group(items);
// 		console.log(group)

// 		group.fillColor = group.children[0].fillColor

// 		group.selected = true
// 	}

// 	// Demo
// 	r = new Path.Rectangle([20,30,100,140])
// 	r.fillColor = 'red'
// 	r.selected = true

// 	c = new Path.Circle([300,100], 40)
// 	c.fillColor = 'green'
// 	c.selected = true

// 	$('a.tool[data-tool=rectangle]').on('click', function() {
// 		rectTool.activate()
// 		$('a.tool').removeClass('active')
// 		$(this).addClass('active')
// 	}).click()

// 	$('a.tool[data-tool=drag]').on('click', function() {
// 		dragTool.activate()
// 		$('a.tool').removeClass('active')
// 		$(this).addClass('active')
// 	}).click()

// 	$('a.tool[data-tool=circle]').on('click', function() {
// 		circleTool.activate()
// 		$('a.tool').removeClass('active')
// 		$(this).addClass('active')
// 	}).click()

// 	$('a.tool[data-tool=select]').on('click', function() {
// 		selectTool.activate()
// 		$('a.tool').removeClass('active')
// 		$(this).addClass('active')
// 	})

// 	$('a.tool[data-tool=group]').on('click', function() {
// 		groupSelection()
// 	})

// })