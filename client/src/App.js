import React  from 'react';
import { SocketIOProvider } from "use-socketio";

import { Game } from "./components/Game/Game";
import './App.css';

export const App = () => {

  return (
    <SocketIOProvider url={process.env.REACT_APP_SOCKET_HOST}>
      <Game />
    </SocketIOProvider>
  )
};