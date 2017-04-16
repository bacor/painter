
/**
 * Selection tool
 *
 * The default and most important tool that selects, drags and edits items.
 * Depending on where the user clicks, the selection tool enters a different
 * *mode* (one of `selecting, editing, dragging`). The behaviour is determined
 * largely through the mode the selector is in.
 */

selectTool = new Tool()
var currentItems = [];

function switchTool(newTool, event) {
	selectOnly(currentItems);

	// Update the new tool, this is a bit hacky though.
	newTool._downPoint = event.downPoint;
	newTool._point = event.downPoint;
	newTool._downCount += 1; // Not strictly necessary

	// Reactivate selection tool afterwards!
	var _onMouseUp = newTool.onMouseUp
	newTool.onMouseUp = function(event) {
		_onMouseUp(event)
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
	hitResult = project.hitTest(event.point, {
		fill: true,
		tolerance: 5
	})

	// Get currently selected items
	currentItems = getSelected()

	// We hit something!
	if(hitResult) {
		var item = hitResult.item

		// Shadow --> select actual item
		if(item.type == 'shadow') item = item.parent.item;

		// Anmination handles shouldn't do anything
		if(isAnimationHandle(item)) return;
			
		// We hit a handle --> edit selection
		if(isHandle(item)) {
			currentItems = [item];
			switchTool(manipulateTool, event);
		}

		// We hit an object --> drag
		else if(item.type) {
			mode = 'dragging'

			// Select the group if the item we hit is in a group
			if(inGroup(item)) item = getOuterGroup(item);
			
			// If the shift key is pressed, just add the item to the selection.
			if(Key.isDown('shift')) {
				currentItems.push(item);	
			}

			// If you click outside the selection, deselect the current selection
			// and select the thing you clicked on.
			else if(!item.isSelected()) {
				currentItems = [item]
			}
			
			var newTool = Key.isDown('alt') ? cloneTool : dragTool;
			switchTool(newTool, event)

		} else return;
	} 

	// Nothing was hit; start a selection instead
	else {
		currentItems = []
		switchTool(selectionTool, event)
	}
}