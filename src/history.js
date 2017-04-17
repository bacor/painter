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
 */
P._HistoryClass = paper.Base.extend({

	initialize: function() {
		this.states = [{}];
		this.index = 0;
		this.maxStates = 50;
	},

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
	registerState: function(undo, redo) {
		this.states = this.states.slice(0, this.index+1);
		this.states.push({redo: redo, undo: undo });
		this.index += 1;

		if(this.states.length > this.maxStates) {
			this.states = this.states.slice(this.states.length - this.maxStates);
			this.index = this.states.length - 1;
		}
	},

	/**
	 * Redo the last action
	 *
	 * Moves the index one step forward in the history, if possible.
	 * @return 
	 */
	redo: function() {
		if(this.index >= this.states.length-1) return false;
		this.index += 1;
		this.states[this.index].redo();
	},

	/**
	 * Undo the last action
	 * @return {None} 
	 */
	undo: function() {
		if(this.index == 0) return false;
		this.states[this.index].undo();
		this.index -= 1;
	}
})

// Instantiate
P.History = new P._HistoryClass();
