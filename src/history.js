/**
 * History
 *
 * Registers actions and implements undo/redo functionality. Actions 
 * are registered by providing two functions, `undo` and `redo`, that
 * take no other arguments (i.e., they are thunks). When registering 
 * these functions, care has to be taken that the right variables are
 * copied and scoped appropriately so that later actions do not change
 * the references in the `un/redo` functions. 
 *
 * Actions for animations are a bit tricky, as one has to track the
 * complete `item.animation` object. All this is solved in animations.js.
 *
 * This object is defined in Module style, see
 * https://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
 */
P.History = (function() {
	
	var states = [{}],
			
			/**
			 * Index of the current state
			 * @type {Number}
			 */
			index = 0,
			
			/**
			 * The maximum number of states stored.
			 * @type {Number}
			 */
			maxStates = 20;

	/**
	 * Register a state to the history
	 * 
	 * @param  {Function} undo An function that when called undoes the
	 * action. The function should take no arguments and take care of
	 * scoping and copying relevant variables itself.
	 * @param  {Function} redo A redo function that when called redoes
	 * the action undone by `undo`. Again, it takes no arguments.
	 * @return {None}
	 */
	var registerState = function(undo, redo) {
		states = states.slice(0, index+1);
		states.push({redo: redo, undo: undo });
		index += 1;

		if(states.length > maxStates) {
			states = states.slice(states.length - maxStates);
			index = states.length - 1;
		}
	}

	/**
	 * Redo the last action
	 *
	 * Moves the index one step forward in the history, if possible.
	 * @return 
	 */
	var redo = function() {
		if(index >= states.length-1) return false;
		index += 1;
		states[index].redo();
	}

	/**
	 * Undo the last action
	 * @return {None} 
	 */
	var undo = function() {
		if(index == 0) return false;
		states[index].undo();
		index -= 1;
	}

	/**
	 * Reveal to P.History
	 */
	return {
		registerState: registerState,
		undo: undo,
		redo: redo,
		states: states
	};

})();
