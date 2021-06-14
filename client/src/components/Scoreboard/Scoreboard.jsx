import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";
import { makeStyles, Tooltip } from '@material-ui/core';

import './Scoreboard.css'

const colorClassMap = {
  0: 'scoreboard-player-progress player-one',
  1: 'scoreboard-player-progress player-two',
  2: 'scoreboard-player-progress player-three',
  3: 'scoreboard-player-progress player-four'
};

const useStyles = makeStyles((theme) => ({
  scoreboard: {
    padding: theme.spacing(2),
    paddingLeft: theme.spacing(3),
    height: '30%',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
      paddingLeft: theme.spacing(1),
    }
  },
  skunkLine: {
    position: 'absolute',
    left: 'calc(75% - 4px)',
    bottom: '-8px',
    fontSize: '20px',
    color: 'black'
  }
}));

export const Scoreboard = () => {
  const classes = useStyles();
  const game = localStorage.getItem('cribbage-live-game');
  const name = localStorage.getItem('cribbage-live-name');
  const [players, setPlayers] = useState({});
  const [winningScore, setWinningScore] = useState(0);
  const [skunkLine, setSkunkLine] = useState(0);
  const [winnerBell] = useSound('/sounds/winner.wav', { volume: 0.5 });

  const { socket } = useSocket("points", msg => {
    // let width = (msg.amount / winningScore) * 100;
    setPlayers({...players, [msg.player]: msg.amount});
    if (msg.amount >= winningScore) {
      if (msg.winning_score) {
        if (msg.amount < msg.winning_score) {
          return
        }
      }
      announceWin(msg.player);
    }
  });

  useSocket("draw_board", msg => {
    setPlayers(msg.players);
    setWinningScore(msg.winning_score);
    setSkunkLine(Math.floor(msg.winning_score * 0.75));
  });

  useSocket("winner", msg => {
    winnerBell();
  });

  function announceWin(player) {
    socket.emit('winner', { game: game, player: player });
  }

  const renderProgressBars = () => {
    const { [name]: playerScore, ...opponents } = players;

    return opponents ? (
      <div className={classes.scoreboard}>
        {Object.entries(opponents).map( ([player, score], index) => (
          <div key={index} className='scoreboard-player row'>
            <span className='scoreboard-player-name col-10'>{player}</span>
            <div className="progress col-10">
              <div
                className={`${colorClassMap[index]} progress-bar`}
                role="progressbar"
                aria-valuemin="0" aria-valuenow={score} aria-valuemax={winningScore}
                style={{"width": `${score/winningScore * 100}%`}}>
              </div>
              <Tooltip className={classes.skunkLine} title={`Skunk line is ${skunkLine}`} aria-label="skunk-line"><span>|</span></Tooltip>
            </div>
            <div className="scoreboard-player-score col-2">{score}</div>
          </div>
        ))}
        <div key={Object.keys(players).length} className='scoreboard-player row'>
          <span className='scoreboard-player-name col-10'>{name}</span>
          <div className="progress col-10">
            <div
              className={`${colorClassMap[Object.keys(opponents).length]} progress-bar`}
              role="progressbar"
              aria-valuemin="0" aria-valuenow={playerScore} aria-valuemax={winningScore}
              style={{"width": `${playerScore/winningScore * 100}%`}}>
            </div>
            <Tooltip className={classes.skunkLine} title={`Skunk line is ${skunkLine}`} aria-label="skunk-line"><span >|</span></Tooltip>
          </div>
          <div className="scoreboard-player-score col-2">{playerScore}</div>
        </div>
      </div>
    ) : (
      <span />
    );
  };

  return (
    <>
      { renderProgressBars() }
    </>
  )
}