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