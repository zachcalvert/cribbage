import React from 'react';
import ReactDOM from "react-dom";

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from "@mui/material/CssBaseline";
import { teal, indigo, blueGrey } from '@mui/material/colors';

import Game from "./components/Game";

const themeLight = createTheme({
  palette: {
    primary: {
      main: teal[900]
    },
    background: {
      default: blueGrey[50],
      paper: '#fff'
    }
  },
  typography: {
    "fontFamily": "Comic Sans MS",
  },
});

const themeDark = createTheme({
  palette: {
    primary: {
      main: indigo[700]
    },
    background: {
      default: "#222222",
      paper: '#263238'
    },
    text: {
      primary: "#ffffff",
      secondary: "#f5f5f5",
      link: "#90caf9"
    }
  }
});

export default function App() {
  const [darkMode, setDarkMode] = React.useState(false);

  const handleDarkMode = () => {
    setDarkMode((prev) => !prev)
  }
  return (
    <ThemeProvider theme={darkMode ? themeDark : themeLight}>
      <CssBaseline />
      <Game darkMode={darkMode} handleDarkMode={handleDarkMode} />
    </ThemeProvider>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);