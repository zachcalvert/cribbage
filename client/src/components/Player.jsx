import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider } from "@material-ui/core";
import './Cards.css'
import Button from "@material-ui/core/Button";


export const Player = (name) => {
  const game = sessionStorage.getItem('game');
  const [cards, setCards] = useState([]);

  const { socket } = useSocket("deal", newCards =>
    setCards([newCards])
  );

  const getCardImage = (name) => {
    return 'cards/' + { name } + '.svg';
  };

  const renderCards = () => {
    return cards.length ? (
      <span>
        {cards.map(({ name }, index) => (
          <ReactSVG key={index} wrapper='span' src='cards/5H.svg' />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  const handleDeal = (e) => {
    console.log('discard event');
    socket.emit('deal', {game: game});
  }

  return (
    <div className="player">
      <Button onClick={handleDeal}>Deal</Button>
      <div className="player-name">{ name.name }</div>
      <Divider variant="middle" />
      {renderCards()}
    </div>
  );
}