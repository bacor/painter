# Painter

Painter, for lack of a better name, is a drawing environment based on Paper.js.


## Installation
The directory `dist` contains the entire app (all the rest is for development). So just open `dist.html` in your browser.

## Development
After installing all node modules (`npm install `) and bower components (`bower install`) several Grunt tasks produce a working version of the app in `dist`. More precisely, `grunt dist` copies and concatenates all required files to the `dist` directory and `grunt watch` does so continuously.

## Credits
A quick list of software used

* Painter.js
* Some icons (see `dist/styles`)
* jQuery (Not needed; remove?)
* ...

# Notes

There are only three kind of items: circles, rectangles and groups. Circles and rectangles are instances of `Path` with type `circle` and `rectangle` respectively; groups are just normal paper groups. Every item has a corresponding bounding box, accessed through the `item.bbox` property, and conversely item is stored in `bbox.item`. The bounding box consists of a border (type `border`) and some handles (type `handle`). The bounding box has a fixed position relative to the object itself. So if the object moves, the bounding box moves with it. 

Every item can have (at most) one animation, stored in a `item.animation` object:

```
item.animation = {
    type: "rotate",     // the type of animation (rotate/bounce),
    handles: group,     // A paper.Group containing all animation handles,
    properties: { ... } // Object with additional properties
    active: true        // flag indicating whether the item is animating
}
```

Animations are all identified by a name (e.g. `"rotate"` or `"bounce"`) and registered in a global object `animations`. An animation object is of the following form:

```
animations.rotate = {
    onInit: function(item, properties) {...},
    onStart: function(item, properties) {...},
    onStop: function(item, properties) {...},
    onFrame: function(event, item, properties) {...},
    onReset: function(item, properties) {...},
    onMove: function(item, delta) {...}
}
```

These functions are called by several global functions: `initAnimation`, `startAnimation`, `stopAnimation` and `resetAnimation`.

# Grouping
When grouping items, they should be relocated to a new coordinate system. More concretely, let's say the group has a origin (its position) and two basis vectors. All items in the group should then be positioned in this coordinate system and animated in this system. We could store the origin and basis in every item and position it in its own coordinate system. A grouping operation would change the basis and origin of all items. Ungrouping would set the basis and origin of the items to the origin and basis of the group. 

All of this has in fact already been implemented in Paper.js. We just have to set up some thing properly to ensure that all items in a group are positioned relatively to the groups pivot:

```
group.pivot = [0,0];
group.transformContent = false;
```

It is important to set the pivot, since it default to the center point of the bounding rectangle. As children of the group move around, the bounding box, hence the pivot changes, resulting in unexpected movement. Fixing the pivot resolves this.


# Various
- Use name instead of type?
- Use data attribute of item to store animations?
- 

# Extending Paper.js?
There are only a few types of shapes that can be drawn: 
- Rectangles (--> PathItem --> Item)
- Circles (--> PathItem --> Item)
- Groups (--> Item)

1. **Bounding box** First of all, we have introduced a custom bounding box, which is different for different types of items. The bounding box can have several handles interacting with the selection tool.  
2. **Animations** Every item 




