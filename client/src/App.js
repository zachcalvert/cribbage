import React, { useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { indigo, green } from '@mui/material/colors';
import Game from './components/Game';

const outerTheme = createTheme({
  palette: {
    primary: {
      main: indigo[200],
    },
    secondary: {
      main: green[500],
    },
  },
});

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

export default function App() {
  const [mode, setMode] = useState('light');

  const toggleColorMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={outerTheme}>
      <ThemeProvider theme={theme}>
        <ColorModeContext.Provider value={{ toggleColorMode }}>
          <Game />
        </ColorModeContext.Provider>
      </ThemeProvider>
    </ThemeProvider>
  );
}
