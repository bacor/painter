/**
 * Painter.js
 */

paper.install(window);

var mainColor = '#78C3D0';

function groupSelection() {
	var items = getSelected();
	var group = new Group(items);
	group.type = 'group'
	// group.fillColor = group.children[0].fillColor
	selectOnly(group)
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
	items = getSelected();
	for(var i=0; i<items.length;i++) {
		deselect(items[i])
		items[i].remove()
	}
}

function cloneSelection(move=[0,0]) {
	var items = getSelected(), 
			copiedItems = [];

	// Clone all the currently selected items
	for(var i=0; i<items.length; i++) {
		copy = items[i].clone();
		copy.position = copy.position.add(move);
		copy.type = items[i].type;
		copiedItems.push(copy);
	}

	selectOnly(copiedItems);
	return copiedItems;
}

function stopRotatingSelection() {
	var items = getSelected()
	items.map(stopRotating);
}

function continueRotatingSelection() {
	var items = getSelected()
  items.map(continueRotating);
}

function resetRotationSelection() {
	var items = getSelected();
	items.map(resetRotation);
}

$(window).ready(function() {

	paper.setup('canvas');

	function onKeyDown(event) {
		if(event.key == 'backspace' || event.key == 'd') {
			deleteSelection()
		}

		else if(event.key == 'space') {
			$('a.tool[data-tool=playpause]').click();
		}

		else if(event.key == 'z') {
			$('a.tool[data-tool=reset]').click();
		}

		else if(event.key =='g') {
			groupSelection()
		}

		else if(event.key =='u') {
			ungroupSelection()
		}

		else if(event.key == 'r') {
			$('a.tool[data-tool=rotate]').click();
		}

		else if(event.key == 'v') {
			$('a.tool[data-tool=select]').click();
		}

		else if(event.key == 'c') {
			$('a.tool[data-tool=circle]').click();
		}

		else if(event.key == 's') {
			$('a.tool[data-tool=rectangle]').click();
		}
	}

	// rectTool.onKeyDown = onKeyDown;
	// circleTool.onKeyDown = onKeyDown;
	// selectTool.onKeyDown = onKeyDown;
	// rotationTool.onKeyDown = onKeyDown;

	// // Demo
	// r = new Path.Rectangle([20,30,100,140])
	// r.fillColor = 'red'
	// // r.selected = true
	// r.type = 'rectangle'

	// c = new Path.Circle([300,100], 40)
	// c.fillColor = 'green'
	// // c.selected = true
	// c.type = 'circle'
	// select(c)
	// select(r)
	// groupSelection()
	// deselectAll()


	// 	// Demo
	// r = new Path.Rectangle([200,200,100,140])
	// r.fillColor = 'green'
	// // r.selected = true
	// r.type = 'rectangle'

	// c = new Path.Circle([500,300], 40)
	// c.fillColor = 'green'
	// // c.selected = true
	// c.type = 'circle'
	// // select(c)
	// select(r)

	// // rotate(c, new Point([100,100]))
	// // rotate()


	$('a.tool[data-tool=rectangle]').on('click', function() {
		rectTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=circle]').on('click', function() {
		circleTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

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

	$('a.tool[data-tool=clone]').on('click', function() {
		cloneSelection([20,20])
	})

	$('a.tool[data-tool=playpause]').on('click', function() {
		if($(this).data('state') == 'play') {
			continueRotatingSelection()
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')
		} else {
			stopRotatingSelection()
			$(this).find('span').html('play <code>space</code>')
			$(this).data('state', 'play')
		}
	})

	$('a.tool[data-tool=rotate]').on('click', function() {
		rotationTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=reset]').on('click', function() {
		resetRotationSelection()
	})

	$('.swatch[data-color]').each(function(i, el){
		$(el).css('backgroundColor', $(el).data('color'));
	})

})