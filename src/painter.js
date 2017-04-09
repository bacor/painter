/**
 * Painter.js
 */

paper.install(window);

var mainColor = '#78C3D0';

function group(items) {
	var group = new Group(items);
	group.type = 'group'
	group.transformContent = false;
	var bounds = getBounds(group)

	group.pivot = new Point(bounds.center);
	setupItem(group);
	selectOnly(group)
	startAnimation(items, false, true)
}

/**
 * See https://github.com/paperjs/paper.js/issues/1026
 * @param  {Group} group 
 * @return {Array}       Children
 */
function ungroup(group) {
	if(group instanceof Array) return group.map(ungroup);
	if(!isGroup(group)) return;

	children = group.removeChildren().filter(isItem);
	group.parent.insertChildren(group.index, children);

	// Transform animated children just like the group
	for(var i=0; i<children.length; i++){
		var item = children[i];
		
		if(!hasAnimation(group)) {
			item.transform(group.matrix);
			if(item.bbox) item.bbox.transform(group.matrix);
		}

		if(hasAnimation(item)) {
			var type = item.animation.type,
					properties = item.animation.properties;
			var onTransform = animations[type].onTransform || function() {};
			onTransform(item, properties, group.matrix);
		}
	}

	// Remove and reset
	deselect(group);
	group.remove();
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
	var items = getSelected();
	var copiedItems = items.map(function(i) {return clone(i, move)});
	selectOnly(copiedItems);
	return copiedItems;
}

/**
 * Clones an item
 *
 * This doesn't work perfectly yet as not all properties are transferred
 * In particular, children of a group don't have the proper names.
 * This could all be solved by moving all custom attributes to the
 * `Item.data` attribute.
 * 
 * @param  {[type]} item [description]
 * @param  {Array}  move [description]
 * @param  {[type]} 0]   [description]
 * @return {[type]}      [description]
 */
function clone(item, move=[0,0]) {
	var copy = item.clone();
	copy.parent = item.parent;
	copy.type = item.type;
	copy.position = copy.position.add(move);

	// Animate the item!
	if(hasAnimation(item)) {
		var type = item.animation.type,
				props = item.animation.properties;
		var onClone = animations[type].onClone || function() {};
		var newProps = jQuery.extend(true, {}, props);
		select(copy);
		initAnimation(copy, type, newProps);
		if(isAnimating(item)) startAnimation(copy);
	}

	return copy;
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

	// Hmmmm....
	bounceTool = animations.bounce.tool
	rotationTool = animations.rotate.tool
	
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
			group(getSelected())
		}

		else if(event.key =='u') {
			ungroup(getSelected())
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
	group(getSelected())
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
	}).click()

	$('a.tool[data-tool=group]').on('click', function() {
		group(getSelected())
	})

	$('a.tool[data-tool=ungroup]').on('click', function() {
		ungroup(getSelected())
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
	})//.click()

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