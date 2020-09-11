import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";
import LinearProgress from "@material-ui/core/LinearProgress";

import './Scoreboard.css'

const colorClassMap = {
  0: 'scoreboard-player-progress col-10 player-one',
  1: 'scoreboard-player-progress col-10 player-two',
  2: 'scoreboard-player-progress col-10 player-three',
  3: 'scoreboard-player-progress col-10 player-four'
}

export const Scoreboard = () => {
  const game = sessionStorage.getItem('game');
  const [players, setPlayers] = useState({});
  const [winningScore, setWinningScore] = useState(0);
  const [winnerBell] = useSound('/sounds/winner.wav', { volume: 0.5 });

  const { socket } = useSocket("draw_board", msg => {
    setPlayers(msg.players);
    setWinningScore(msg.winning_score);
  });

  useSocket("points", msg => {
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
    return players ? (
      <>
        {Object.entries(players).map( ([player, score], index) => (
          <div key={index} className='scoreboard-player row'>
            <span className='scoreboard-player-name col-10'>{player}</span>
            <LinearProgress
              className={`${colorClassMap[index]}`}
              variant="determinate"
              value={score}
              aria-valuemax={winningScore}
            />
            <div className="scoreboard-player-score col-2">{score}</div>
          </div>
        ))}
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