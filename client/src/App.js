import React, { useEffect, useState}  from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { green, orange } from '@mui/material/colors';

import { socket } from './socket';
import Header from './components/Header/Header';
import Game from "./components/Game";

const outerTheme = createTheme({
  palette: {
    primary: {
      main: green[500],
    },
    secondary: {
      main: orange[500],
    },
  },
});

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('connected!')
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <ThemeProvider theme={outerTheme}>
      <Header isConnected={isConnected} />
      <Game />
    </ThemeProvider>
  )
};
