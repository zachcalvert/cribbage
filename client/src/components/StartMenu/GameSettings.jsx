import React from 'react';

import Box from '@mui/material/Box';
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from '@mui/material/InputLabel';

export default function GameSettings({setWinningScore, setCribSize, jokers, setJokers}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          defaultValue="121"
          id="name"
          onChange={(e) => setWinningScore(e.target.value)}
          label="Winning score"
          variant="standard"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <FormControl>
          <InputLabel>Crib size</InputLabel>
          <Select
            defaultValue="4"
            onChange={(e) => setCribSize(e.target.value)}
            variant="standard"
          >
            <MenuItem value={4}>Standard (4 cards)</MenuItem>
            <MenuItem value={5}>Spicy (5 cards)</MenuItem>
            <MenuItem value={6}>Chaotic (6 cards)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={jokers}
            onChange={(e) => setJokers(e.target.checked)}
            name="checkedB"
            color="primary"
          />
        }
        label="Play with Jokers"
      />
    </Box>
  );
};