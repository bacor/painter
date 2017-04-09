/**
 * Painter.js
 */

paper.install(window);

// function onFrame() {
// 	var items = project.getItems()
// 	console.log(items)
// 	for(var i=0;i>items.length; i++){
// 		showBoundingBox(items[i])
// 	}
// }

var mainColor = '#78C3D0';

function groupSelection() {
	
	var items = getSelected();
	resetAnimation(items)
	var group = new Group(items);
	group.type = 'group'

	// console.log(group.bounds, group.bounds.center)
	// corners = group.bbox.children[0].segments;
	// middle = corners[0].point.add(corners[2].point).divide(2)
	group.pivot = new Point(group.bounds.center);

	setupItem(group);
	selectOnly(group)
	startAnimation(items)
}

function ungroupSelection() {
	// Get all currently selected groupos
	var groups = project.getItems({
		class: Group,
		match: isSelected
	})
	ungroup(groups)
}

/**
 * See https://github.com/paperjs/paper.js/issues/1026
 * @param  {Group} group 
 * @return {Array}       Children
 */
function ungroup(group) {
	if(group instanceof Array) return group.map(ungroup);

	resetAnimation(group)
	children = group.removeChildren();
	group.parent.insertChildren(group.index,  children);
	deselect(group);
	group.remove();

	// resetAnimation(children)
	select(children)
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

function getColor(i, num_colors, noise=.4, css=true) {
	var noise = Math.random() * noise - .5*noise
	var hue = ( (i+noise) / num_colors * 360 ) % 360
	if(hue < 0) hue = 360 + hue;
	var color = {
		hue: Math.round(hue),
		saturation: 75,
		brightness: 60
	}
	if(css) return "hsl(" + color.hue+', '+color.saturation+'%, '+color.brightness+'%)';
	else return color
}

function getActiveSwatch() {
	var index = $('.swatch.active').data('colorIndex');
	var numSwatches = $('.swatch.active').data('numSwatches');
	return getColor(index, numSwatches)
}

function changeColorSelection() {
	var items = getSelected();
	for(var i=0; i<items.length; i++){
		var item = items[i];
		item.fillColor = getActiveSwatch();
	}
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

		else if(event.key == 'b') {
			$('a.tool[data-tool=bounce]').click();	
		}

		else if(!isNaN(parseInt(event.key))) {
			var key = parseInt(event.key);
			$('.swatch').each(function(i, el){
				var index = $(el).data('colorIndex')
				if(index+1 == key) $(el).click();
			})
		}
	}

	rectTool.onKeyDown = onKeyDown;
	circleTool.onKeyDown = onKeyDown;
	selectTool.onKeyDown = onKeyDown;
	rotationTool.onKeyDown = onKeyDown;
	bounceTool.onKeyDown = onKeyDown;

	// Demo
	r = new Path.Rectangle([20,30,100,140])
	r.fillColor = getColor(0, 7)
	// r.selected = true
	r.type = 'rectangle'
	setupItem(r)
	c = new Path.Circle([300,100], 40)
	c.fillColor = getColor(1, 7)
	// c.selected = true
	c.type = 'circle'
	setupItem(c)
	select(c)
	select(r)
	groupSelection()
	deselectAll()


		// Demo
	r = new Path.Rectangle([200,200,100,140])
	r.fillColor = getColor(3, 7)
	// r.selected = true
	r.type = 'rectangle'
	setupItem(r)

	c = new Path.Circle([500,300], 40)
	c.fillColor = getColor(4, 7)
	// c.selected = true
	c.type = 'circle'
	setupItem(c)
	// select(c)
	select(r)

	// rotate(c, new Point([100,100]))
	// rotate()


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
	})

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
			startAnimation(getSelected());
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')

		} else {
			stopAnimation(getSelected());
			$(this).find('span').html('play <code>space</code>')
			$(this).data('state', 'play')
		}
	})

	$('a.tool[data-tool=rotate]').on('click', function() {
		rotationTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	})

	$('a.tool[data-tool=bounce]').on('click', function() {
		bounceTool.activate()
		$('a.tool').removeClass('active')
		$(this).addClass('active')
	}).click()

	$('a.tool[data-tool=reset]').on('click', function() {
		resetAnimation(getSelected(), 'rotate');
	})

	// Add all swatches
	var $swatches = $('.swatches'),
			numSwatches = parseInt($swatches.data('num-swatches'));
	for(var i=0; i<numSwatches; i++) {

		// Get color without noise
		var color = getColor(i, numSwatches, 0);

		// Add swatch handle
		var $swatch = $('<a class="swatch">' + (i+1) + '</a>')
					.css('backgroundColor', color)
					.data('colorIndex', i)
					.data('numSwatches', numSwatches)
					.appendTo($swatches)
					.on('click', function() {
						$('.swatch').removeClass('active');
						$(this).addClass('active');
						changeColorSelection();
					})
		if(i == 0) $swatch.addClass('active');
	}



})