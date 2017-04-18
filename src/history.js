/**
 * History
 *
 * @class  Registers actions and implements undo/redo functionality. Actions 
 * are registered by providing two functions, `undo` and `redo`, that
 * take no other arguments (i.e., they are thunks). When registering 
 * these functions, care has to be taken that the right variables are
 * copied and scoped appropriately so that later actions do not change
 * the references in the `un/redo` functions. 
 *
 * History is always instantiated in `P.history`. Use this to register
 * new states.
 *
 * @name History
 * @memberOf P
 */
P.History = paper.Base.extend(/** @lends History */{

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
	 * @instance
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
	 * @instance
	 */
	redo: function() {
		if(this.index >= this.states.length-1) return false;
		this.index += 1;
		this.states[this.index].redo();
	},

	/**
	 * Undo the last action
	 * @instance
	 */
	undo: function() {
		if(this.index == 0) return false;
		this.states[this.index].undo();
		this.index -= 1;
	},

	canUndo: function() {
		return this.index > 0
	},

	canRedo: function() {
		return this.index < this.states.length - 1
	}
})

/**
 * Instance of the {@link P.History} class.
 * 
 * @type {P.History}
 * @memberOf P
 * @instance
 */
P.history = new P.History();

// Register actions
P.registerAction('undo', function() { P.history.undo() });
P.registerAction('redo', function() { P.history.redo() })
