/**
 * Painter.js
 */

var demoContent = true//false;

$(window).ready(function() {

	paper.setup('canvas');
	
	var hotKeys = {
		's': 'tool:rectangle',		
		'c': 'tool:circle',
		'r': 'tool:rotate',
		'b': 'tool:bounce',
		'v': 'tool:select',
		'd': 'action:delete',
		'backspace': 'action:delete',
		'g': 'action:group',
		'u': 'action:ungroup',
		'n': 'action:clone',
		'z': 'action:undo:control',
		'y': 'action:redo:control',
		'space': 'action:playPause',
		']': 'action:bringToFront',
		'[': 'action:sendToBack',
	}

	function onKeyDown(event) {

		// Swatch!
		if(!isNaN(parseInt(event.key))) {
			var key = parseInt(event.key);
			$('.swatch').each(function(i, el){
				var index = $(el).data('colorIndex')
				if(index+1 == key) $(el).click();
			})
		}

		if(!(event.key in hotKeys)) return false;

		// Look up what we have to do...
		var parts = hotKeys[event.key].split(':'),
				type = parts[0], 
				name = parts[1],
				modifier = parts[2] || false;

		// If a modifier (e.g. control) is specified, only continue
		// if the modifier is also pressed
		if(modifier && !event.modifiers[modifier]) return false;
		
		if(type == 'tool') {
			activateTool(name);
		}

		if(type == 'action') {
			doAction(name);
		}
	}

	function activateTool(name) {
		P.tools[name].activate();

		// Activate only this tool's icon
		$('a.tool').removeClass('active');
		var $tool = $('a.tool[data-tool='+name+']');
		$tool.addClass('active');
	}

	function doAction(name) {
		var args = {
			'clone': [[20,20]],
		}
		
		var action = P.actions[name];
		
		// Arguments for the action
		var artefacts = P.getSelected();
		var args = {
			'clone': [[20,20]],
		}
		var _args = (name in args) ? args[name] : [];
		_args = [artefacts].concat(_args);

		// Call the action
		P.actions[name].apply(this, _args);

		updateInterface();		
	}

	function updateInterface() {
		// Undo and redo
		$('#undo').toggleClass('disabled', !P.history.canUndo());
		$('#redo').toggleClass('disabled', !P.history.canRedo());

		// Get all selected, animating objects
		var artefacts = P.getSelected().mfilter('hasAnimation')

		// Some animated objects have been selected
		if(artefacts.length > 0) {
			$('#stop, #play, #pause').removeClass('disabled');
			var playing = artefacts[0].isAnimating();
			$('#play').toggleClass('hidden', playing);
			$('#pause').toggleClass('hidden', !playing);

		// No animated objects have been selected, disable controls
		} else {
			$('#stop, #play, #pause').addClass('disabled');
		}
	}

	// Initialize all tools
	for(name in P.tools) {

		// Handle KeyDown events the same for all tools
		var tool = P.tools[name];
		tool.onKeyDown = onKeyDown;

		// Activate when tool icon is clicked
		var $icon = $('a.tool[data-tool='+name+']');
		$icon.on('click', function() {
			var name = $(this).data('tool');
			activateTool(name);
		});
	}

	// Link icons to tools
	for(name in P.actions) {
		$('a.tool[data-action='+name+']').on('click', function() {
			var name = $(this).data('action');
			doAction(name);
		});
	}

	// Update interface
	paper.view.onMouseUp = function() {
		setTimeout(updateInterface, 10)
	}
	updateInterface()
	activateTool('select');

	// Demo content
	if(demoContent) {
		r = new P.Artefact.Rectangle([20,30,100,140])
		r.item.fillColor = P.getColor(0, 7);
		r.select()

		s = new P.Artefact.Rectangle([200,30,100,140])
		s.item.fillColor = P.getColor(2, 7);

		c = new P.Artefact.Circle([300,300], 40)
		c.item.fillColor = P.getColor(1, 7);
	}

	// https://github.com/paperjs/paper.js/issues/673
	function getBlobURL(content, type) {
	    return URL.createObjectURL(new Blob([content], {
	        type: type
	    }));
	}

	$('#download').click(function() {
		var svg = P.exportSVG();
		this.href = getBlobURL(svg, 'image/svg+xml');
		this.download = 'drawing.svg';
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
						P.actions.changeColor(P.getSelected());
					})
		if(i == 0) $swatch.addClass('active');
	}
})