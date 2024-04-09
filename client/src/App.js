import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { indigo, green } from '@mui/material/colors';

import Game from "./components/Game";

const outerTheme = createTheme({
  palette: {
    primary: {
      main: indigo[900],
    },
    secondary: {
      main: green[500],
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={outerTheme}>
      <Game />
    </ThemeProvider>
  )
};
