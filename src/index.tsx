import * as React from "react";
import * as ReactDOM from "react-dom";
import { TodoApp } from "./app";
import { TodoModel } from "./todoModel";

var model = new TodoModel('react-todos');

function render() {
  console.log('render')
  ReactDOM.render(
    <TodoApp model={model}/>,
    document.getElementsByClassName('root')[0]
  );
}

model.subscribe(render);
render();