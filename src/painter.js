/**
 * Painter.js
 */

// Probably want to get rid of this and use 
// the paper namespace everywhere
paper.install(window);

/**
 * Painter, encapsulates everything!
 * @type {Object}
 */
var P = {};


// P.PainterItem = paper.Item.extend({

// 	initialize: function() {},

// 	showBoundingBox: function() {
// 		if(this.bbox) {
// 			this.bbox.visible = true
// 		}
// 		else {
// 			bbox = this.getBoundingBox();
// 			bbox.item = item;
// 			this.bbox = bbox;
// 			this.insertBelow(bbox)
// 		}
// 	}
// })
