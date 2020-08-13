import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider } from "@material-ui/core";
import './Opponent.css'

export const Opponent = (props) => {
  const [cards, setCards] = useState([]);

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setCards(msg.cards[props.name]);
    }
  });

  const renderCards = () => {
    return cards.length ? (
      <span>
        {cards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper='span'
            className='opponent-card'
            // src={`/cards/${cards[index]}.svg`}
            src={`/cards/dark_blue.svg`}
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