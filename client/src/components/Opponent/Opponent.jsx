import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider } from "@material-ui/core";
import './Opponent.css'

export const Opponent = (props) => {
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [showCards, setShowCards] = useState(false);

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
    }
    if (msg.crib === true) {
      setShowCards(true);
    } else {
      setShowCards(false);
    }
  });

  useSocket("card_played", msg => {
    if (props.name === msg.player) {
      setPlayableCards(playableCards.filter(card => card !== msg.card));
      setPlayedCards([...playedCards, msg.card]);
    }
  });

  const renderCards = () => {
    return playableCards.length ? (
      <span>
        {playableCards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper='span'
            className='opponent-card'
            src={ showCards ? `/cards/${playableCards[index]}.svg` : `/cards/dark_blue.svg`}
          />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  return (
    <>
      <span>{ props.name }</span>
      <Divider className='opponent-divider' variant="middle" />
      { renderCards() }
    </>
  );
}