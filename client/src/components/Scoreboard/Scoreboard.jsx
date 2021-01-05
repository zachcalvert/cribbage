import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import './Scoreboard.css'

const colorClassMap = {
  0: 'scoreboard-player-progress player-one',
  1: 'scoreboard-player-progress player-two',
  2: 'scoreboard-player-progress player-three',
  3: 'scoreboard-player-progress player-four'
};

export const Scoreboard = () => {
  const game = sessionStorage.getItem('game');
  const name = sessionStorage.getItem('name');
  const [players, setPlayers] = useState({});
  const [winningScore, setWinningScore] = useState(0);
  const [winnerBell] = useSound('/sounds/winner.wav', { volume: 0.5 });

  const { socket } = useSocket("draw_board", msg => {
    setPlayers(msg.players);
    setWinningScore(msg.winning_score);
  });

  useSocket("points", msg => {
    // let width = (msg.amount / winningScore) * 100;
    setPlayers({...players, [msg.player]: msg.amount});
    if (msg.amount >= winningScore) {
      announceWin(msg.player);
    }
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