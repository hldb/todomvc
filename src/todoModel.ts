/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */

/// <reference path="./interfaces.d.ts"/>

import * as collab from './collab'
import { Utils } from "./utils";

// Generic "model" object. You can use whatever
// framework you want. For this application it
// may not even be worth separating this logic
// out, but we do this to demonstrate one way to
// separate out parts of your application.
class TodoModel implements ITodoModel {

  public key : string;
  public todos : Array<ITodo>;
  public onChanges : Array<any>;

  constructor(key) {
    this.key = key;
    this.todos = Utils.store(key);
    this.onChanges = [];
  }

  public subscribe(onChange) {
    this.onChanges.push(onChange);
  }

  public inform() {
    Utils.store(this.key, this.todos);
    this.onChanges.forEach(function (cb) { cb(); });
  }

  public addTodo(title : string) {
    const todo = {
      id: Utils.uuid(),
      title: title,
      completed: false
    }
    this.todos = this.todos.concat(todo);

    void collab.putTodos([todo])
  }

  public toggleAll(checked : Boolean) {
    // Note: It's usually better to use immutable data structures since they're
    // easier to reason about and React works very well with them. That's why
    // we use map(), filter() and reduce() everywhere instead of mutating the
    // array or todo items themselves.
    const todos = this.todos.map<ITodo>((todo : ITodo) => {
      return Utils.extend({}, todo, {completed: checked});
    });
    this.todos = todos

    void collab.putTodos(todos)
  }

  public toggle(todoToToggle : ITodo) {
    let toggled: ITodo
    this.todos = this.todos.map<ITodo>((todo : ITodo) => {
      if (todo !== todoToToggle) {
        return todo
      } else {
        toggled = Utils.extend({}, todo, {completed: !todo.completed});
        return toggled
      }
    });

    void collab.putTodos([toggled])
  }

  public destroy(todo : ITodo) {
    this.todos = this.todos.filter(function (candidate) {
      return candidate !== todo;
    });

    void collab.delTodos([todo])
  }

  public save(todoToSave : ITodo, text : string) {
    let saved: ITodo
    this.todos = this.todos.map(function (todo) {
      if (todo !== todoToSave) {
        return todo
      } else {
        saved = Utils.extend({}, todo, {title: text});
        return saved
      }
    });

    void collab.putTodos([saved])
  }

  public clearCompleted() {
    const completed = this.todos.filter(todo => todo.completed)
    this.todos = this.todos.filter(function (todo) {
      return !todo.completed;
    });

    void collab.delTodos(completed)
  }
}

export { TodoModel };
