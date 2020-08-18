import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider } from "@material-ui/core";
import './Opponent.css'

export const Opponent = (props) => {
  const [cards, setCards] = useState([]);
  const [showCards, setShowCards] = useState(false);

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setCards(msg.cards[props.name]);
    }
    if (msg.crib === true) {
      setShowCards(true);
    } else {
      setShowCards(false);
    }
  });

  const renderCards = (show) => {
    return cards.length ? (
      <span>
        {cards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper='span'
            className='opponent-card'
            src={ showCards ? `/cards/${cards[index]}.svg` : `/cards/dark_blue.svg`}
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