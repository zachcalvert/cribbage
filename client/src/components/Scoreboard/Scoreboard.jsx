import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";
import LinearProgress from "@material-ui/core/LinearProgress";
import './Scoreboard.css'


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
        {Object.entries(players).map( ([player, score]) => (
          <div key={player} className='scoreboard-player row'>
            <span className='scoreboard-player-name col-2'>{player}</span>
            <LinearProgress
              className='scoreboard-player-progress col-8'
              variant="determinate"
              value={score}
              aria-valuemax={winningScore}
            />
            <span className='scoreboard-player-total col-2'>
              {score}
            </span>
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