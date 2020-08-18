import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { ReactSVG } from 'react-svg'
import { Divider, Fab } from "@material-ui/core";
import './Player.css'

export const Player = (props) => {
  const [action, setAction] = useState('start');
  const [turn, setTurn] = useState(true);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState('');
  const [peggingTotal, setPeggingTotal] = useState(0);
  const [showPeggingTotal, setShowPeggingTotal] = useState(false);
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });
  const game = sessionStorage.getItem('game');

  const { socket } = useSocket("send_turn", msg => {
    if (msg.players.includes(props.name)) {
      setTurn(true);
      setAction(msg.action);
    } else {
      setTurn(false);
      setAction(`waiting for ${msg.players}`)
    }
    if (msg.action === 'play' || msg.action === 'pass') {
      setShowPeggingTotal(true);
    } else {
      setShowPeggingTotal(false);
    }
  });

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setCards(msg.cards[props.name]);
    }
  });

  useSocket("card_played", msg => {
    if (props.name === msg.player) {
      let svg = document.getElementById(msg.card).getElementsByTagName('svg')[0];
      svg.classList.add('hidden');
    }
    setShowPeggingTotal(true);
    setPeggingTotal(msg.pegging_total);
  });

  useSocket("points", msg => {
    if (props.reason === 'go') {
      setPeggingTotal(0);
    }
  });

  const handleAction = (e) => {
    boop();
    if (action === 'start') {
      socket.emit('start_game', {game: game, winning_score: 121, jokers: false});
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
      <div className='row player-header'>
        <div className='col-3 played-cards'></div>
        <div className='col-6'>
          <Fab variant="extended"
            className="action-button"
            color="primary"
            onClick={handleAction}
            disabled={!turn}>
            { action }
          </Fab>
        </div>
        <div className='col-3'>
          {showPeggingTotal ? (
            <span className='pegging-total'>{peggingTotal}</span>
          ) : (
            <span />
          )}
        </div>
      </div>
      <Divider variant="middle" />
      <div className="player-cards">
      { renderCards() }
      </div>
    </>
  );
}