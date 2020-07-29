import React  from 'react';
import { SocketIOProvider } from "use-socketio";
import { Game } from "./components/Game";

import './App.css';

export const App = () => (
  <SocketIOProvider url="http://localhost:5000">
    <Game />
  </SocketIOProvider>
);