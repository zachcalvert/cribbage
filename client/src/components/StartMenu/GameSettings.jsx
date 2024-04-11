import React from 'react';

import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";import InputLabel from '@mui/material/InputLabel';

export default function GameSettings({setWinningScore, setCribSize, jokers, setJokers}) {
  return (
        <>
          <TextField
            defaultValue="121"
            id="name"
            onChange={e => setWinningScore(e.target.value)}
            label="Winning score"
            variant="standard"
          />

          <FormControl>
            <InputLabel>Crib size</InputLabel>
            <Select
              defaultValue="4"
              onChange={e => setCribSize(e.target.value)}
              variant="standard"
            >
              <MenuItem value={4}>Standard (4 cards)</MenuItem>
              <MenuItem value={5}>Spicy (5 cards)</MenuItem>
              <MenuItem value={6}>Chaotic (6 cards)</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={jokers}
                onChange={e => setJokers(e.target.checked)}
                name="checkedB"
                color="primary"
              />
            }
            label="Play with Jokers"
          />
      </>
  );
};