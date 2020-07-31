import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider } from "@material-ui/core";
import '../Player/Player.css'

export const Opponent = (props) => {
  const [cards, setCards] = useState([]);

  const { socket } = useSocket("deal", response => {
    let dealt = response.hands[props.name];
    setCards(dealt);
  });

  const renderCards = () => {
    return cards.length ? (
      <span>
        {cards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper='span'
            src={`/cards/${cards[index]}.svg`}
          />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  return (
    <div className="player">
      <span>{ props.name }</span>
      <Divider variant="middle" />
      { renderCards() }
    </div>
  );
}