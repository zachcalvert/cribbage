import React  from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { green, orange } from '@mui/material/colors';

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

export const App = () => (
  <ThemeProvider theme={outerTheme}>
    <Header />
    <Game />
  </ThemeProvider>
);
