import React  from 'react';
import { ModalProvider } from "react-modal-hook";
import { SocketIOProvider } from "use-socketio";
import { TransitionGroup } from "react-transition-group";

import { Game } from "./components/Game/Game";
import './App.css';

export const App = () => {

  return (
    <SocketIOProvider url={process.env.REACT_APP_SOCKET_HOST}>
      <ModalProvider rootComponent={TransitionGroup}>
        <Game />
      </ModalProvider>
    </SocketIOProvider>
  )
};