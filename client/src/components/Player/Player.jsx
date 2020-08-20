import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { ReactSVG } from 'react-svg'
import { Divider, Fab } from "@material-ui/core";
import './Player.css'

export const Player = (props) => {
  const [action, setAction] = useState('start');
  const [turn, setTurn] = useState(true);

  const [activeCard, setActiveCard] = useState('');
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);

  const [peggingTotal, setPeggingTotal] = useState(0);
  const [showPeggingTotal, setShowPeggingTotal] = useState(false);
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });
  const game = sessionStorage.getItem('game');

  const { socket } = useSocket("send_turn", msg => {
    setActiveCard('');
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
    if (msg.action === 'deal') {
      setPlayableCards([]);
    }
  });

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
      setPlayedCards([]);
    }
  });

  useSocket("card_played", msg => {
    if (props.name === msg.player) {
      setPlayableCards(playableCards.filter(card => card !== msg.card));
      setPlayedCards([...playedCards, msg.card]);
    }
    setShowPeggingTotal(true);
    setPeggingTotal(msg.pegging_total);
  });

  useSocket("points", msg => {
    if (msg.reason === 'go') {
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
    document.activeElement.blur();
  };

  const handleCardClick = (e) => {
    let card = e.target.parentNode.parentNode.parentNode.id;  // :(
    if (card) {
      setActiveCard(card);
    }
  };

  const renderPlayedCards = () => {
    return playedCards.length ? (
      <>
        {playedCards.map((card, index) => (
          <ReactSVG
            id={card}
            className='played-card'
            key={index}
            wrapper='span'
            src={`/cards/${card}.svg`}
          />
        ))}
      </>
    ) : (
      <span />
    );
  };

  const renderPlayableCards = () => {
    return playableCards.length ? (
      <>
        {playableCards.map((card, index) => (
          <ReactSVG
            id={card}
            className={activeCard === card ? 'active-card available-card': 'available-card'}
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
        <div className='col-3 played-cards'>
          { renderPlayedCards() }
        </div>
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
        { renderPlayableCards() }
      </div>
    </>
  );
}