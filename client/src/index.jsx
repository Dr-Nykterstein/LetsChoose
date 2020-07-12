import React from 'react';
import ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader/root';

import App from './components/app';

import 'assets/styles/index.scss';

const AppWithHot = hot(App);

ReactDOM.render(
  <React.StrictMode>
    <AppWithHot />
  </React.StrictMode>,
  document.getElementById('root'),
);
