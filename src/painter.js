/**
 * Painter.js
 */

paper.install(window);

function groupSelection() {
	var items = project.getItems({
		match: isSelected
	})
	var group = new Group(items);
	group.type = 'group'
	group.fillColor = group.children[0].fillColor
	deselectAll()
	select(group)
}

$(window).ready(function() {

	paper.setup('canvas');

	function onKeyDown(event) {
		if(event.key == 'backspace') {
			items = project.getItems({
				match: isSelected
			})
			for(var i=0; i<items.length;i++) {
				deselect(items[i])
				items[i].remove()
			}
		}

		if(event.key == 'space') {
			items = project.getItems({
				class: Path,
				selected: true
			})
			bound(items);

		}
	}

	rectTool.onKeyDown = onKeyDown;
	circleTool.onKeyDown = onKeyDown;
	selectTool.onKeyDown = onKeyDown;

	// Demo
	r = new Path.Rectangle([20,30,100,140])
	r.fillColor = 'red'
	// r.selected = true
	r.type = 'rectangle'

	c = new Path.Circle([300,100], 40)
	c.fillColor = 'green'
	// c.selected = true
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