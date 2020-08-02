import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { ReactSVG } from 'react-svg'
import { Button, Divider } from "@material-ui/core";
import './Player.css'


export const Player = (name) => {
  const game = sessionStorage.getItem('game');
  const [action, setAction] = useState('start');
  const [activeCard, setActiveCard] = useState('');
  const [cards, setCards] = useState([]);

  const { socket } = useSocket("send_turn", response => {
    setAction(response.action);
  });

  useSocket("deal", response => {
    let dealt = response.hands[name.name];
    setCards(dealt);
  });

  const renderCards = () => {
    return cards.length ? (
      <span>
        {cards.map((card, index) => (
          <ReactSVG
            id={card}
            key={index}
            wrapper='span'
            src={`/cards/${card}.svg`}
          />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const handleSelectedCard = (e) => {
    console.log(e);
    e.addClass('selected');
  }

  const handleAction = (e) => {
    boop();
    console.log(action);
    if (action === 'start') {
      socket.emit('start_game', {game: game, winning_score: 121, jokers: true});
    }
    else if (action === 'deal') {
      socket.emit('deal', {game: game});
    }
    else if (action === 'discard') {
      socket.emit('discard', {game: game, player: name, card: activeCard})
    }
  }

  return (
    <div className="player">
      <Button className="action-button" variant="contained" color="secondary" onClick={handleAction}>{ action }</Button>
      <Divider variant="middle" />
      {renderCards()}
    </div>
  );
}