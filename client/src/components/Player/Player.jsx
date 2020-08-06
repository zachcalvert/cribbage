import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { ReactSVG } from 'react-svg'
import { Button, Divider } from "@material-ui/core";
import './Player.css'

export const Player = (props) => {
  const [action, setAction] = useState('start');
  const [turn, setTurn] = useState(true);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState('');
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const game = sessionStorage.getItem('game');

  const { socket } = useSocket("send_turn", msg => {
    if (msg.players.includes(props.name)) {
      setAction(msg.action);
      setTurn(true);
    }
  });

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setCards(msg.cards[props.name]);
    }
  });

  const handleAction = (e) => {
    boop();
    if (action === 'start') {
      socket.emit('start_game', {game: game, winning_score: 121, jokers: true});
    }
    else {
      socket.emit(action, { game: game, player: props.name, card: activeCard });
    }
  };

  const handleCardClick = (e) => {
    let card = e.target.parentNode.parentNode.parentNode.id;  // :(
    if (card) {
      setActiveCard(card);
      let svg = document.getElementById(card).getElementsByTagName('svg')[0];
      svg.classList.add('chosen');
    }
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
      <Button
          className="action-button"
          variant="contained"
          color="secondary"
          onClick={handleAction}
          disabled={!turn}
      >
        { action }
      </Button>
      <Divider variant="middle" />
      <div className="player-cards">
      { renderCards() }
      </div>
    </>
  );
}