/**
 * Registered actions. Actions are functions that operate on one or multiple
 * artefacts. They are registered via {@link P.registerAction} and stored in 
 * {@link P.actions}.
 * 
 * @namespace  P.actions
 */


// Define all actions, but encapsulate in a module in order not to pollute the
// global scope.
(function() {
	/**
	 * Delete the artefacts
	 * 
	 * @param  {Artefact[]} artefacts
	 * @memberOf P.actions
	 * @function delete
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
	 * @memberOf P.actions
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
	 * @memberOf P.actions
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


	/**
	 * Play (or start) the artefacts that have an animation.
	 * 	
	 * @param  {Artefact[]} artefacts 
	 * @return {Artefact[]} those of the passed artefacts that have an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var play = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().start();
		})
	}
	P.registerAction('play', play);

	/**
	 * Pause the animated artefacts
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} Those of the passed artefacts with an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var pause = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().pause();
		})
	}
	P.registerAction('pause', pause);

	/**
	 * Stop the animated artefacts
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} Those of the passed artefacts with an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var stop = function(artefacts) {
		return artefacts.mfilter('hasAnimation').map(function(artefact) {
				return artefact.getAnimation().stop();
		})
	}
	P.registerAction('stop', stop);

	/**
	 * Play or pause the animation. The first artefact is used as a reference:
	 * it this is animating, all animations (of the artefacts passed to the
	 * function) will be paused, otherwise all will be started.
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} Those of the passed artefacts with an animation
	 * @memberOf P.actions
	 * @instance
	 */
	var playPause = function(artefacts) {
		var artefacts = artefacts.mfilter('hasAnimation');
		if(artefacts[0].isAnimating()) {
			return pause(artefacts)
		} else {
			return play(artefacts);
		}
	}
	P.registerAction('playPause', playPause);

	/**
	 * Bring the artefacts to the front
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]} 
	 * @memberOf P.actions
	 * @instance
	 */
	var bringToFront = function(artefacts) {
		var indices;

		var redo = function() {
			indices = artefacts.map(function(artefact) {
				return artefact.item.index
			});
			return artefacts.mmap('bringToFront');
		}

		var undo = function() {
			for(var i=0; i<artefacts.length; i++) {
				var artefact = artefacts[i];
				artefact.item.parent.insertChild(indices[i], artefact.item);
			}
		}

		P.history.registerState(undo, redo);

		return redo();
	}
	P.registerAction('bringToFront', bringToFront);

	/**
	 * Send artefacts to the back
	 * 	
	 * @param  {Artefact[]} artefacts
	 * @return {Artefact[]}
	 * @memberOf P.actions
	 * @instance
	 */
	var sendToBack = function(artefacts) {
		var indices;

		var redo = function() {
			indices = artefacts.map(function(artefact) {
				return artefact.item.index
			});
			return artefacts.mmap('sendToBack');
		}

		var undo = function() {
			for(var i=0; i<artefacts.length; i++) {
				var artefact = artefacts[i];
				artefact.item.parent.insertChild(indices[i], artefact.item);
			}
		}

		P.history.registerState(undo, redo);

		return redo();
	}
	P.registerAction('sendToBack', sendToBack);

})();

