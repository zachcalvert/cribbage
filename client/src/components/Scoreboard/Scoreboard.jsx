import React, { useEffect, useState } from "react";

import Tooltip from '@mui/material/Tooltip';

import { socket } from "../../socket";

import './Scoreboard.css'

const colorClassMap = {
  0: 'scoreboard-player-progress player-one',
  1: 'scoreboard-player-progress player-two',
  2: 'scoreboard-player-progress player-three',
  3: 'scoreboard-player-progress player-four'
};

export const Scoreboard = () => {
  const game = sessionStorage.getItem('room');
  const name = sessionStorage.getItem('name');
  const [players, setPlayers] = useState({});
  const [winningScore, setWinningScore] = useState(0);
  const [skunkLine, setSkunkLine] = useState(0);

  useEffect(() => {
    function onDrawBoard(msg) {
      setPlayers(msg.players);
      setWinningScore(msg.winning_score);
      setSkunkLine(Math.floor(msg.winning_score * 0.75));
    }

    function onPoints(msg) {
      setPlayers({...players, [msg.player]: msg.amount});
      if (msg.amount >= winningScore) {
        socket.emit('winner', { game: game, player: msg.player })
      }
    }

    socket.on('draw_board', onDrawBoard);
    socket.on('points', onPoints)

    return () => {
      socket.off('draw_board', onDrawBoard);
      socket.off('points', onPoints)
    };
  }, [game, players, winningScore]);

  const renderProgressBars = () => {
    const { [name]: playerScore, ...opponents } = players;

    return opponents ? (
      <>
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
              <Tooltip className="skunk-line" title={`Skunk line is ${skunkLine}`} aria-label="skunk-line"><span>|</span></Tooltip>
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
            <Tooltip className="skunk-line" title={`Skunk line is ${skunkLine}`} aria-label="skunk-line"><span >|</span></Tooltip>
          </div>
          <div className="scoreboard-player-score col-2">{playerScore}</div>
        </div>
      </>
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