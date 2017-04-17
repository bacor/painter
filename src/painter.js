/**
 * Painter.js
 */

/**
 * Painter, encapsulates everything!
 * @type {Object}
 * @global
 * @namespace 
 */
var P = {

	/**
	 * The color used for bounding boxes, animation handles etc.
	 * 
	 * @type {String}
	 * @private
	 */
	mainColor: '#78C3D0',

	/**
	 * Select an artefact or multiple artefacts.
	 * 
	 * @param  {Artefact[]} artefact One or multiple artefacts
	 * @return {Artefact[]}
	 * @instance
	 */
	select: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.select);
		return artefact.select();
	},

	/**
	 * Deselect an artefact
	 *
	 * This removes the bounding box and resets styling specific to selected
	 * items.
	 * @param  {Artefact[]} artefact One or multiple artefacts
	 * @return {Artefact[]}
	 * @instance
	 */
	deselect: function(artefact) {
		if(artefact instanceof Array) return artefact.map(P.deselect);
		return artefact.deselect();
	},

	/**
	 * Deselects all the currently selected artefacts.
	 *
	 * @return {Artefact[]} The artefacts that were deselected
	 * @instance
	 */
	deselectAll: function() {
		return P.getArtefacts().mmap('deselect');
	},

	/**
	 * Selects only this artefact and deselect all others.
	 * 
	 * @param {Artefact[]} aftefact The artefact or artefacts to select
	 * @return {Artefact[]} The selected artefact(s)
	 * @instance
	 */
	selectOnly: function(artefact) {
		P.deselectAll();
		return P.select(artefact);
	},

	/**
	 * Get all artefacts
	 * 
	 * @return {Artefact[]}
	 * @instance
	 */
	getArtefacts: function() {
		return Object.values(P.artefacts);
	},

	/**
	 * Return all selected artefacts
	 * 
	 * @return {Artefact[]}
	 * @instance
	 */
	getSelected: function() {
		return P.getArtefacts().filter(function(artefact) {
			return artefact.isSelected();
		})
	},

	/*****************************************************/

	/**
	 * Test if the artefact is a handle
	 * 
	 * @param  {paper.Item} item The handle
	 * @return {Boolean}
	 * @instance
	 */
	isHandle: function(item) {
		if(!item.name) return false;
		return item.name.startsWith('handle');
	},

	/**
	 * Test if an item is in a group
	 * @param  {paper.Item}	item
	 * @return {Boolean}
	 * @instance
	 */
	inGroup: function(item) {
		if(item.parent) return item.parent.className == 'Group';
		return false;
	},

	/**
	 * Test if an object is an artefact. It can test both whether a Paper.js
	 * item corresponds to an artefact or whether an object actually is
	 * an instance of {@link Artefact}, when `strict=true`.
	 * 
	 * @param  {paper.Item|Artefact} obj The object to Test
	 * @param  {Boolean} [strict=false] Only match objects that are actual 
	 * instances of {@link Artefact}?
	 * @return {Boolean}
	 * @instance
	 */
	isArtefact: function(obj, strict) {
		if(obj instanceof P.Artefact) return true;
		if(!strict && obj.data && obj.data._artefact) 
			return P.isArtefact(obj.data._artefact);
		return false;
	},

	/*****************************************************/

	/**
	 * Get the artefact corresponding to an item.
	 * 	
	 * @param  {paper.Item} item 
	 * @return {Artefact|Boolean} The Artefact or `false` if none was found.
	 * @instance
	 */
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
	 * Find the outermost group containing the item.
	 * 
	 * @param  {paper.Item} 	item 
	 * @return {paper.Group}  The outermost group containing `item`
	 * @instance
	 */
	getOuterGroup: function(item) {
		if(P.inGroup(item.parent)) return P.getOuterGroup(item.parent);
		return item.parent
	},

	/*****************************************************/

	/**
	 * Get the `i`'th of `num_color` equally spaced colors in the HSB spectrum.
	 * 
	 * @param  {Number}  i 					 Which color to fetch, by index.
	 * @param  {Number}  num_colors  Divide the spectrum in how many colors?
	 * @param  {Float}   [noise=0.4] Noise
	 * @param  {Boolean} css         If `true` it returns a CSS-friendly color string.
	 * @return {String}
	 * @instance
	 */
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
	
	/**
	 * Get the active swatch
	 * 
	 * @return {String}
	 */
	getActiveSwatch: function() {
		var index = $('.swatch.active').data('colorIndex');
		var numSwatches = $('.swatch.active').data('numSwatches');
		return P.getColor(index, numSwatches)
	},

};


/**
 * Method Map: calls a method of every element in an array. This makes 
 * chaining super easy with arrays of Artefacts, for example.
 * 
 * @example
 * // Get the currently selected artefacts
 * var artefacts = P.getSelected();
 * 
 * // First clone them and then select them
 * var move = [30, 40]
 * artefacts.mmap('clone', [move]).mmap('select');
 *
 * @param  {String} name The method to apply
 * @param  {Array} args An array of arguments passed to the method.
 * @return {Array}      An array with the result of every call
 * @inner
 * @memberof Array
 * @global
 */
Array.prototype.mmap = function(name, args) {
	return this.map(function(element) {
		return element[name].apply(element, args);
	});
}
