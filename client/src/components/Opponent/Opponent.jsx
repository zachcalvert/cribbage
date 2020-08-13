import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider } from "@material-ui/core";
import '../Player/Player.css'

export const Opponent = (props) => {
  const [cards, setCards] = useState([]);

  useSocket("deal", msg => {
    let dealt = msg.hands[props.name];
    setCards(dealt);
  });

  const renderCards = () => {
    return cards.length ? (
      <span>
        {cards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper='span'
            className='opponent-card'
            src={`/cards/${cards[index]}.svg`}
          />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  return (
    <div className="opponent">
      <span>{ props.name }</span>
      <Divider variant="middle" />
      { renderCards() }
    </div>
  );
}