import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Button, Divider } from "@material-ui/core";
import './Cards.css'


export const Player = (name) => {
  const game = sessionStorage.getItem('game');
  const [cards, setCards] = useState([]);

  const { socket } = useSocket("deal", newCards =>
    setCards(['4H', '5S', '5C', '5D', '6S', 'JD'])
  );

  const getCardImage = (name) => {
    return 'cards/' + { name } + '.svg';
  };

  const renderCards = () => {
    return cards.length ? (
      <span>
        {cards.map((card , index) => (
          <ReactSVG key={index} wrapper='span' src={`/cards/${card}.svg`} />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  const handleDeal = (e) => {
    console.log('deal event');
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