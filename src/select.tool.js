
/**
 * Selection tool
 *
 * The default and most important tool that selects, drags and edits items.
 * Depending on where the user clicks, the selection tool enters a different
 * *mode* (one of `selecting, editing, dragging`). The behaviour is determined
 * largely through the mode the selector is in.
 */

selectTool = new paper.Tool()

function switchTool(newTool, event, artefacts, target) {

	// Update the new tool, this is a bit hacky though.
	newTool._downPoint = event.downPoint;
	newTool._point = event.downPoint;
	newTool._downCount += 1; // Not strictly necessary

	// Store the current artefacts
	newTool._artefacts = artefacts;
	newTool._target = target;

	// Mouse Down
	var _onMouseDown = newTool.onMouseDown || function() {};
	newTool.onMouseDown = function(event) {
		var artifacts = event.tool._artefacts,
				target = event.tool._target;
		return _onMouseDown(event, artifacts, target);
	}

	// Mouse Drag
	var _onMouseDrag = newTool.onMouseDrag || function() {}
	newTool.onMouseDrag = function(event) {
		var artifacts = event.tool._artefacts,
				target = event.tool._target;
		return _onMouseDrag(event, artifacts, target);
	}

	// Reactivate selection tool afterwards!
	var _onMouseUp = newTool.onMouseUp || function() {};
	newTool.onMouseUp = function(event) {
		var artifacts = event.tool._artefacts,
				target = event.tool._target;
		_onMouseUp(event, artifacts, target);
		selectTool.activate()
	}

	// Update the event
	event.tool = newTool;
	
	// Activate!
	newTool.activate()
	if(newTool.onSwitch) {
		newTool.onSwitch(event)
	} else {
		newTool.emit('mousedown', event)
	} 
}

selectTool.onMouseDown = function(event) {
	
	// Test if we hit an item
	var hitResult = project.hitTest(event.point, {
		fill: true,
		tolerance: 5
	})

	// We hit noting!
	if(!hitResult) {
		P.deselectAll();
		switchTool(selectionTool, event, []);
	}
	
	// We hit a handle --> edit selection
	else if(P.isHandle(hitResult.item)) {
		if(hitResult.item.name.endsWith('animation')) return;
		var artefacts = [P.getArtefact(hitResult.item)]
		switchTool(manipulateTool, event, artefacts, hitResult.item);
	}

	// Hit an item
	else {

		// Note: this also fetches the artefact of a shadow
		var hit = P.getArtefact(hitResult.item);
		var artefacts = P.getSelected();

		if(Key.isDown('shift')) {

			// Already selected: remove from selection
			if(hit.isSelected()) {
				var index = artefacts.indexOf(hit);
				artefacts.splice(index, 1);
			} 

			// Not selected yet: add to selection
			else {
				artefacts.push(hit);	
			}

		}
		
		// If you click outside the selection with no modifiers, select the hit.
		else if(!hit.isSelected()) {
			artefacts = [hit]
		}

		// Update selection
		P.selectOnly(artefacts);

		// Switch
		var newTool = Key.isDown('alt') ? cloneTool : dragTool;
		switchTool(newTool, event, artefacts)
	}
}