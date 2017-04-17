
P.deleteSelection = function(artefacts) {
	var artefacts = artefacts || P.getSelected();

	var undo = function() {
		artefacts.mmap('restore').mmap('select');
	}

	var redo = function() {
		artefacts.mmap('destroy');
	}
	
	P.History.registerState(undo, redo);

	redo();
}

P.group = function(items) {

	var undo = function() {
		// To do: this breaks up the history chain since we no 
		// longer refer to the same group...
		artefact.ungroup().mmap('select');
	}

	var redo = function() {
		return artefact = new P.Artefact.Group(items).select();
	}

	P.History.registerState(undo, redo)		

	// Perform the action
	return redo();
}

/**
 * See https://github.com/paperjs/paper.js/issues/1026
 * @param  {Group} group 
 * @return {Array}       Children
 */
P.ungroup = function(theGroup) {
	if(theGroup instanceof Array) return theGroup.map(P.ungroup);
	if(!theGroup.ungroup) return false;
	var children;

	var redo = function() {
		children = theGroup.ungroup();
		return children.mmap('select');
	}

	var undo = function() {
		theGroup = new P.Artefact.Group(children);
	}

	P.History.registerState(undo, redo);
	
	// Perform the action
	return redo();
}

P.cloneSelection = function(move=[0,0]) {
	var artefacts = P.getSelected();
	var clones = artefacts.mmap('clone').mmap('move', [move]);
	P.selectOnly(clones);

	var undo = function() {
		clones.mmap('destroy');
	}
	var redo = function() {
		clones.mmap('restore').mmap('select');
	}
	P.History.registerState(undo, redo)

	return clones;
}


P.changeColorSelection = function() {
	var swatch = P.getActiveSwatch(),
			artefacts = P.getSelected(),
			origColors;
	
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
	
	P.History.registerState(undo, redo);

	redo();
}