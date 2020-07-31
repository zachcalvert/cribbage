import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { animated, useTrail } from 'react-spring';
import { ReactSVG } from 'react-svg'
import { Button, Divider } from "@material-ui/core";
import './Cards.css'


export const Player = (name) => {
  const game = sessionStorage.getItem('game');
  const [cards, setCards] = useState([]);
  const config = { mass: 10, tension: 2000, friction: 200 };

  const trail = useTrail(cards.length, {
    config,
    opacity: cards.length ? 1 : 0,
    x: cards.length ? 0 : 20,
    height: cards.length ? 80 : 0,
    from: { opacity: 1, x: 0, height: 0 },
  });

  const AnimatedSVG = animated(ReactSVG);

  const { socket } = useSocket("deal", response => {
    let dealt = response.hands[name.name];
    setCards(dealt);
  });

  const renderCards = () => {
    return cards.length ? (
      <span>
        {trail.map(({ x, height, ...rest }, index) => (
          <AnimatedSVG
            key={index}
            wrapper='span'
            src={`/cards/${cards[index]}.svg`}
            style={{ ...rest, transform: x.interpolate(x => `translate3d(0,${x}px,0)`) }}
          />
        ))}

      </span>
    ) : (
      <span />
    );
  };

  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const handleDeal = (e) => {
    console.log('deal event');
    { boop() }
    socket.emit('deal', {game: game});
  }

  return (
    <div className="player">
      <Button className="action-button" variant="contained" color="secondary" onClick={handleDeal}>Deal</Button>
      <Divider variant="middle" />
      {renderCards()}
    </div>
  );
}