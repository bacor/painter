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

There are only three kind of items: circles, rectangles and groups. Circles and rectangles are instances of `Path` with type `circle` and `rectangle` respectively; groups are just normal paper groups. Every item has a corresponding bounding box, accessed through the `item.bbox` property (to do), and conversely item is stored in `bbox.item`. The bounding box consists of a border (type `border`) and some handles (type `handle`). The bounding box has a fixed position relative to the object itself. So if the object moves, the bounding box moves with it. 

Every item can have (at most) one animation, stored in a `item.animation` object:

```
item.animation = {
    type: "rotate",     // the type of animation (rotate/bounce),
    handles: group,     // A paper.Group containing all animation handles,
    properties: { ... } // Object with additional properties
    active: true        // flag indicating whether the item is animating
}
```

Animations are all identified by a name (e.g. `"rotate"` or `"bounce"`)
