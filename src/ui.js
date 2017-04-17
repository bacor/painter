/**
 * Painter.js
 */

paper.install(window);

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */


$(window).ready(function() {

	paper.setup('canvas');

	// Hmmmm....
	bounceTool = P.animations.bounce.tool
	rotationTool = P.animations.rotate.tool
	
	function onKeyDown(event) {

		if(event.key == 'backspace' || event.key == 'd') {
			P.deleteSelection()
		}

		else if(event.key == 'space') {
			$('a.tool[data-tool=playpause]').click();
		}

		else if(event.key == 'z') {
			if(Key.isDown('control')) {
				P.History.undo()
			}
			else {
				$('a.tool[data-tool=reset]').click();
			}
		}

		else if(event.key =='y' && Key.isDown('control')) {
			P.History.redo()
		}

		else if(event.key =='g') {
			P.group(P.getSelected())
		}

		else if(event.key =='u') {
			P.ungroup(P.getSelected())
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

	r = new P.Artefact.Rectangle([20,30,100,140])
	r.item.fillColor = P.getColor(0, 7);
	r.select()

	s = new P.Artefact.Rectangle([200,30,100,140])
	s.item.fillColor = P.getColor(2, 7);

	c = new P.Artefact.Circle([300,300], 40)
	c.item.fillColor = P.getColor(1, 7);

	// var anim = r.animate('bounce', { speed: 2, position: 0 });
	// // console.log(r, anim)
	// anim.update({ startPoint: new Point([0,0]), endPoint: new Point([200,200])})
	// r.getAnimation().start()
	// console.log(r)
	// // Demo
	// r = new Path.Rectangle([20,30,100,140])
	// r.fillColor = getColor(0, 7)
	// // r.selected = true
	// r.type = 'rectangle'
	// setupRectangle(r)
	// setupItem(r)

	// c = new Path.Circle([300,100], 40)
	// c.fillColor = getColor(1, 7)
	// // c.selected = true
	// c.type = 'circle'
	// setupItem(c)
	// select(c)
	// select(r)
	// group(P.getSelected())
	// deselectAll()


		// Demo
// 	r = new Path.Rectangle([200,200,100,140])
// 	r.fillColor = getColor(3, 7)
// 	// r.selected = true
// 	r.type = 'rectangle'
// 	setupItem(r)
// setupRectangle(r)
// 	c = new Path.Circle([500,300], 40)
// 	c.fillColor = getColor(4, 7)
// 	// c.selected = true
// 	c.type = 'circle'
// 	setupItem(c)
// 	// select(c)
// 	select(r)

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
		P.group(P.getSelected())
	})

	$('a.tool[data-tool=ungroup]').on('click', function() {
		P.ungroup(P.getSelected())
	})

	$('a.tool[data-tool=delete]').on('click', function() {
		P.deleteSelection()
	})

	$('a.tool[data-tool=clone]').on('click', function() {
		P.cloneSelection([20,20])
	})

	$('a.tool[data-tool=playpause]').on('click', function() {
		if($(this).data('state') == 'play') {
			P.getSelected().map(function(artefact){
				if(artefact.hasAnimation()) artefact.animation.start();
			});
			$(this).find('span').html('pause <code>space</code>')
			$(this).data('state', 'pause')

		} else {
			P.getSelected().map(function(artefact){
				if(artefact.hasAnimation()) artefact.animation.pause();
			});
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
		P.getSelected().map(function(artefact) { 
			if(artefact.hasAnimation()) artefact.animation.stop() 
		})
	})

	// Add all swatches
	var $swatches = $('.swatches'),
			numSwatches = parseInt($swatches.data('num-swatches'));
	for(var i=0; i<numSwatches; i++) {

		// Get color without noise
		var color = P.getColor(i, numSwatches, 0);

		// Add swatch handle
		var $swatch = $('<a class="swatch">' + (i+1) + '</a>')
					.css('backgroundColor', color)
					.data('colorIndex', i)
					.data('numSwatches', numSwatches)
					.appendTo($swatches)
					.on('click', function() {
						$('.swatch').removeClass('active');
						$(this).addClass('active');
						P.changeColorSelection();
					})
		if(i == 0) $swatch.addClass('active');
	}



})