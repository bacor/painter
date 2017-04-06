/**
 * Painter.js
 */

paper.install(window);

function groupSelection() {
	var items = project.activeLayer.getItems({
		match: isSelected
	})
	var group = new Group(items);
	group.type = 'group'
	group.fillColor = group.children[0].fillColor
	
	select(group)
}

function ungroupSelection() {
		
	// Get all currently selected groupos
	var groups = project.getItems({
		class: Group,
		match: isSelected
	})

	// Remove the items from the group and insert them at
	// the same position in the tree.
	// See https://github.com/paperjs/paper.js/issues/1026
	for( var i=0; i<groups.length; i++) {
		var group = groups[i];

		children = group.removeChildren();
		select(children)

		group.parent.insertChildren(group.index,  children);
		deselect(group);
		group.remove();
	}
}

function deleteSelection() {
	items = project.getItems({
		match: isSelected
	})
	for(var i=0; i<items.length;i++) {
		deselect(items[i])
		items[i].remove()
	}
}

function rotateSelection() {
	items = project.getItems({
		match: isSelected
	})
	for(var i=0;i<items.length; i++) {
		var item = items[i];
		item.onFrame = function() {
			// deselect(this)
			// this.rotation = (this.rotation + 3) % 360
			this.rotate(3)
			// console.log(this, this.rotation)
			if(!inGroup(this) && this.boundingBox) 
				§this.boundingBox.rotate(3);
		}
	}

}

$(window).ready(function() {

	paper.setup('canvas');

	function onKeyDown(event) {
		if(event.key == 'backspace') {
			deleteSelection()
		}

		if(event.key == 'space') {
			items = project.getItems({
				class: Path,
				selected: true
			})
			bound(items);
		}

		console.log(event, event.key, event.modifiers)
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
	select(c)
	select(r)
	groupSelection()
	deselectAll()


		// Demo
	r = new Path.Rectangle([200,200,100,140])
	r.fillColor = 'green'
	// r.selected = true
	r.type = 'rectangle'

	c = new Path.Circle([500,300], 40)
	c.fillColor = 'green'
	// c.selected = true
	c.type = 'circle'
	select(c)
	select(r)
	groupSelection()

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

	$('a.tool[data-tool=ungroup]').on('click', function() {
		ungroupSelection()
	})

	$('a.tool[data-tool=delete]').on('click', function() {
		deleteSelection()
	})


	$('a.tool[data-tool=rotate]').on('click', function() {
		rotateSelection()
	})

})