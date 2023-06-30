import "todomvc-app-css/index.css"
import "todomvc-common/base.css"
import * as React from "react";
import * as ReactDOM from "react-dom";
import { TodoApp } from "./app";
import { TodoModel } from "./todoModel";
import * as collab from './collab'

var model = new TodoModel('react-todos');

function render() {
  ReactDOM.render(
    <TodoApp model={model}/>,
    document.getElementsByClassName('todoapp')[0]
  );
}

model.subscribe(render);
collab.subscribe(render);
render();
