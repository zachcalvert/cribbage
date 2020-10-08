import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { useTrail, animated } from 'react-spring'

import { Divider, Fab } from "@material-ui/core";
import { ReactSVG } from 'react-svg'
import './Player.css'

export const Player = (props) => {
  const game = sessionStorage.getItem('game');
  const [action, setAction] = useState('');
  const [turn, setTurn] = useState(true);
  const [activeCard, setActiveCard] = useState('');
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [peggingTotal, setPeggingTotal] = useState(0);
  const [showPeggingTotal, setShowPeggingTotal] = useState(false);

  // dealt card animation
  const config = { mass: 5, tension: 2000, friction: 100 }
  const trail = useTrail(playableCards.length, {
    config,
    opacity: playableCards ? 1 : 1,
    x: playableCards ? 0 : 20,
    height: playableCards ? 20 : 0,
    from: { opacity: 1, x: 20, height: 0 },
  })

  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

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

  useSocket('invalid_card', msg => {
    setActiveCard('');
  });

  const handleAction = (e) => {
    boop();
    if ((action === 'play' || action ==='discard') && !(activeCard)) {
      socket.emit('chat_message', {name: 'game-updater', message: `Psst! Select a card to ${action} by clicking on it`, game: game, private: true});
      return;
    }
    if (action === 'next') {
      setPlayableCards([])
    }

    socket.emit(action, { game: game, player: props.name, card: activeCard });
    document.activeElement.blur();
  };

  const handleCardClick = (e) => {
    let card = e.target.parentNode.parentNode.parentNode.id;  // :(
    card === activeCard ? (
      setActiveCard('')
    ) : (
      setActiveCard(card)
    )
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
        {trail.map(({ x, height, ...rest }, index) => (
          <animated.div
            key={playableCards[index]}
            className="trails-text"
            style={{ ...rest, transform: x.interpolate(x => `translate3d(0,${x}px,0)`) }}>
            <animated.div style={{ height }}>
              <ReactSVG
                id={playableCards[index]}
                className={activeCard === playableCards[index] ? 'active-card available-card': 'available-card' }
                key={index}
                onClick={handleCardClick}
                wrapper='span'
                src={`/cards/${playableCards[index]}.svg`}
              />
            </animated.div>
          </animated.div>
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
        {action ? <div className='col-6'>
          <Fab variant="extended"
            className="action-button"
            color="primary"
            onClick={handleAction}
            disabled={!turn}>
            { action }
          </Fab>
        </div> : <span/>}
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
};