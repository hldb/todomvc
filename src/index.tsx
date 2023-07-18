import 'todomvc-app-css/index.css';
import 'todomvc-common/base.css';
import {TodoApp} from './app';
import {TodoModel} from './todoModel';
import * as collab from './collab';
import React from 'react';
import {createRoot} from 'react-dom/client';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

var model = new TodoModel('react-todos');

function render() {
	root.render(<TodoApp model={model} />, document.getElementsByClassName('root')[0]);
}

model.subscribe(render);
collab.attach(model);
render();
