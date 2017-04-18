
(function() {
	/**
	 * Delete the artefacts
	 * 
	 * @param  {Artefact[]} artefacts
	 * @memberOf P
	 * @instance
	 */
	var del = function(artefacts) {

		var undo = function() {
			artefacts.mmap('restore').mmap('select');
		}

		var redo = function() {
			artefacts.mmap('destroy');
		}
		
		P.history.registerState(undo, redo);

		redo();
	}
	P.registerAction('delete', del);


	/**
	 * Group an array of artefacts
	 *
	 * @todo The undo operation breaks the history...
	 * @param  {Artefact[]} artefacts The artefacts to group.
	 * @return {Artefact.Group}
	 * @memberOf P
	 * @instance
	 */
	var group = function(artefacts) {

		var undo = function() {
			// To do: this breaks up the history chain since we no 
			// longer refer to the same group...
			artefact.ungroup().mmap('select');
		}

		var redo = function() {
			return artefact = new P.Artefact.Group(artefacts).select();
		}

		P.history.registerState(undo, redo)		

		// Perform the action
		return redo();
	}

	P.registerAction('group', group);

	/**
	 * Ungroup an {@link Artefact.Group}. 
	 * 
	 * Note that there is no ungrouping procedure in  Paper.js 
	 * ([see here](https://github.com/paperjs/paper.js/issues/1026)),
	 * so we implement our own ungrouping operation.
	 * 
	 * @param  {Artefact.Group} 
	 * @return {Artefact[]} An array of children artefacts
	 * @memberOf P
	 * @instance
	 */
	var ungroup = function(theGroup) {
		if(theGroup instanceof Array) return theGroup.map(ungroup);
		if(!theGroup.ungroup) return false;
		var children;

		var redo = function() {
			children = theGroup.ungroup();
			return children.mmap('select');
		}

		var undo = function() {
			theGroup = new P.Artefact.Group(children);
		}

		P.history.registerState(undo, redo);
		
		// Perform the action
		return redo();
	}

	P.registerAction('ungroup', ungroup);

	/**
	 * Clone the currently selected artefacts
	 * 
	 * @param  {Artefact[]} artefacts	asdf	
	 * @param  {Array|paper.Point} [move=[0,0]] Move the clones by this distance.
	 * Defaults to no movement (`[0,0]`).
	 * @return {Artefacts[]} The cloned artefacts
	 * @memberOf P
	 * @instance
	 */
	var clone = function(artefacts, move) {
		var move = move || [0,0];
		var clones = artefacts.mmap('clone').mmap('move', [move]);
		P.selectOnly(clones);

		var undo = function() {
			clones.mmap('destroy');
		}
		var redo = function() {
			clones.mmap('restore').mmap('select');
		}
		P.history.registerState(undo, redo)

		return clones;
	}

	P.registerAction('clone', clone);

	/**
	 * Change the color of the artefacts
	 * 	
	 * @param {Artefact[]} artefacts
	 * @param {String} [swatch=null] The swatch to use. Defaults to the
	 * active swatch.
	 * @memberOf P
	 * @instance
	 */
	var changeColor = function(artefacts, swatch) {
		var swatch = swatch || P.getActiveSwatch();
		var origColors;
		
		var redo = function() {
			origColors = artefacts.map(function(artefact) {
				var origColor = artefact.item.fillColor;
				artefact.item.fillColor = swatch;
				return origColor;
			});
		}

		var undo = function() {
			artefacts.map(function(artefact) {
				var idx = artefacts.indexOf(artefact);
				artefact.item.fillColor = origColors[idx];
			});
		}
		
		P.history.registerState(undo, redo);

		redo();
	}

	P.registerAction('changeColor', changeColor);


	var play = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().start();
		})
	}

	P.registerAction('play', play);

	var pause = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().pause();
		})
	}

	P.registerAction('pause', pause);

	var stop = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().stop();
		})
	}

	P.registerAction('stop', stop);

	var playPause = function(artefacts) {
		var artefacts = artefacts.mfilter('hasAnimation');
		if(artefacts[0].isAnimating()) {
			return pause(artefacts)
		} else {
			return play(artefacts);
		}
	}
	P.registerAction('playPause', playPause);


})();