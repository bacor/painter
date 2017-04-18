
(function() {

	var selectionTool = new paper.Tool();

	var selectRect;

	selectionTool.onMouseDown = function(event, artefacts) {
		selectRect = new paper.Path.Rectangle(event.point, new paper.Size(0,0));
	}

	selectionTool.onMouseDrag = function(event, artefacts) {
		if(selectRect)
			selectRect.remove();
		selectRect = new paper.Path.Rectangle(event.downPoint, event.point);
		selectRect.strokeColor = "#333"
		selectRect.dashArray = [2,3]
		selectRect.strokeWidth = 1
	}

	selectionTool.onMouseUp = function(event, artefacts) {
		// Remove the selection region
		if(selectRect) selectRect.remove();

		// Find all items in the selection area
		rect = new paper.Rectangle(event.downPoint, event.point)
		var items = paper.project.activeLayer.getItems({ 
			overlapping: rect,
			match: function(item) {
				return item.data._artefact != undefined
			}
		});

		// If we put this in the match, it doesn't work?
		// Reimplement?
		items = items.filter(function(item) { 

			var isBBox = item.name == 'bbox';
			var inGroup = (item.parent.className == 'Group' 
				|| item.data._artefact.item.parent.className == 'Group');
			var isGroup = item.data._artefact.className == 'Group';
			
			// Cannot select anything in a group
			if(inGroup) return false;

			// Otherwise, only select BBox if it is a group.
			return !isBBox || (isBBox && isGroup);
		})

		var artefacts = items.map(P.getArtefact);
		P.select(artefacts);
	}

	P.registerTool('selection', selectionTool);

})();