import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { ReactSVG } from 'react-svg'
import { Button, Divider } from "@material-ui/core";
import './Player.css'
import { StartMenuContext } from "../StartMenu/StartMenuContext";

export const Player = (name) => {
  const [action, setAction] = useState('start');
  const [activeCard, setActiveCard] = useState('');
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });
  const [cards, setCards] = useState([]);

  const game = sessionStorage.getItem('game');

  const { socket } = useSocket("send_turn", response => {
    setAction(response.action);
  });

  useSocket("deal", response => {
    let dealt = response.hands[name.name];
    setCards(dealt);
  });

  const handleAction = (e) => {
    boop();
    console.log(action);
    if (action === 'start') {
      // handleModal("This is component modal content")
      socket.emit('start_game', {game: game, winning_score: 121, jokers: true});
    }
    else if (action === 'deal') {
      socket.emit('deal', {game: game});
    }
    else if (action === 'discard') {
      socket.emit('discard', {game: game, player: name, card: activeCard})
    }
  };

  const handleCardClick = (e) => {
    let card = e.target.parentNode.parentNode.parentNode.id;
    setActiveCard(card);
  };

  const renderCards = () => {
    return cards.length ? (
      <>
        {cards.map((card, index) => (
            <ReactSVG
              id={card}
              key={index}
              onClick={handleCardClick}
              wrapper='span'
              src={`/cards/${card}.svg`}
            />
        ))}
      </>
    ) : (
      <span />
    );
  };

  return (
    <>
      <Button className="action-button" variant="contained" color="secondary" onClick={handleAction}>{ action }</Button>
      <Divider variant="middle" />
      <div className="player-cards">
      {renderCards()}
      </div>
    </>
  );
}