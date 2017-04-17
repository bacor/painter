/**
 * Painter.js
 */

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */
var P = {

	mainColor: '#78C3D0',

	/**
	 * Select an item or multiple items.
	 *
	 * The item is not selected using the Paper.js's default `item.selected = true`. 
	 * Rather, we draw a custom bounding box around the item, allowing a bit
	 * more flexibility (e.g. different bounding boxes for different types of
	 * items). To test if an item has been selected using our custom selection
	 * method, the test function `isSelected` can be used.
	 * @param  {mixed} items An item or multiple items
	 * @return {None}
	 */
	select: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.select);
		return artefact.select();
	},

	/**
	 * Deselect an item
	 *
	 * This removes the bounding box and resets styling specific to selected
	 * items.
	 * @param  {item} item 
	 * @return {None}
	 */
	deselect: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.deselect);
		return artefact.deselect();
	},

	/**
	 * Deselects all the currently selected items.
	 *
	 * Again, we don't use the in-built selection mechanism, but rely on our own
	 * bounding boxes. Only items with bounding boxes are deselected, the function
	 * does not care about the value of `item.selected`.
	 * @param  {array} items 
	 * @return {None}
	 */
	deselectAll: function() {
		return P.getArtefacts().mmap('deselect');
	},

	/**
	 * Selects only this item
	 * @param  {item} item The only item to select
	 * @return {None}
	 */
	selectOnly: function(artefacts) {
		P.deselectAll();
		return P.select(artefacts);
	},

	getArtefacts: function() {
		return Object.values(P.artefacts);
	},

	/**
	 * Return all selected items
	 * @param  {Function} match The match function, defaults to isSelected
	 * @return {Array}       Selected items
	 */
	getSelected: function() {
		return P.getArtefacts().filter(function(artefact) {
			return artefact.isSelected();
		})
	},

	/*****************************************************/

	/**
	 * Test if the item is a handle of a bounding box.
	 * @param  {Item}  item 
	 * @return {Boolean}
	 */
	isHandle: function(item) {
		if(!item.name) return false;
		return item.name.startsWith('handle');
	},

	/**
	 * Test if an item is in a group
	 * @param  {Item} 		item 
	 * @return {Boolean}
	 */
	inGroup: function(item) {
		if(item.parent) return item.parent.className == 'Group';
		return false;
	},

	isArtefact: function(obj, strict=false) {
		if(obj instanceof P.Artefact) return true;
		if(!strict && obj.data && obj.data._artefact) 
			return P.isArtefact(obj.data._artefact);
		return false;
	},

	/*****************************************************/

	getArtefact: function(item) {
		if(item.name == 'shadow') {
			return item.parent.data._artefact;
		}

		if(P.inGroup(item)) {
			var outerGroup = P.getOuterGroup(item);
			return P.getArtefact(outerGroup);
		}

		else if(item.data._artefact && P.isArtefact(item.data._artefact)) {
			return item.data._artefact;
		}

		else{
			return false
		}
	},

	/**
	 * Find the higest group in which the item is contained
	 * @param  {Item} 	item 
	 * @return {Group}  The outermost group containing `item`
	 */
	getOuterGroup: function(item) {
		if(P.inGroup(item.parent)) return P.getOuterGroup(item.parent);
		return item.parent
	},

	/*****************************************************/

	getColor: function(i, num_colors, noise=.4, css=true) {
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
	},

	getActiveSwatch: function() {
		var index = $('.swatch.active').data('colorIndex');
		var numSwatches = $('.swatch.active').data('numSwatches');
		return P.getColor(index, numSwatches)
	},

};


// Method Map
Array.prototype.mmap = function(name, args) {
	return this.map(function(element) {
		return element[name].apply(element, args);
	});
}
