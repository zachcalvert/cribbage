import React, { useEffect, useState } from "react";
import { ReactSVG } from "react-svg";

import Divider from "@mui/material/Divider";

import { socket } from "../../socket";
import './Opponent.css'
import { Typography } from "@mui/material";

export const Opponent = ({ opponentName }) => {
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [scoringCards, setScoringCards] = useState([]);
  const [scoreDisplay, setScoreDisplay] = useState('');

  useEffect(() => {
    function onCards(msg) {
      if (opponentName in msg.cards)
      console.log(msg.cards[opponentName])
      setPlayableCards(msg.cards[opponentName]);
      setPlayedCards([]);

      msg.show_to_all === true ? ( setShowCards(true)) : ( setShowCards(false))
    }

    socket.on("cards", onCards);

    return () => {
      socket.off("cards", onCards);
    };
  }, [playableCards, playedCards, showCards, opponentName]);

  useEffect(() => {
    function onPlayCard(msg) {
      if (opponentName === msg.player) {
        setPlayableCards(playableCards.filter(card => card !== msg.card));
        setPlayedCards([...playedCards, msg.card]);
      }
    }

    socket.on("card_played", onPlayCard);

    return () => {
      socket.off("card_played", onPlayCard);
    };
  }, [opponentName, playableCards, playedCards]);

  useEffect(() => {
    function onDisplayScore(msg) {
      if (opponentName === msg.player) {
        setScoreDisplay(msg.text);
        setScoringCards(msg.cards);
      }
    }

    socket.on("display_score", onDisplayScore);

    return () => {
      socket.off("display_score", onDisplayScore);
    };
  }, [opponentName, scoreDisplay, scoringCards]);

  useEffect(() => {
    function onSendTurn(msg) {
      setScoringCards([]);
    }

    socket.on("send_turn", onSendTurn);

    return () => {
      socket.off("send_turn", onSendTurn);
    };
  }, [scoringCards]);

  const renderCards = () => {
    return playableCards.length ? (
      <span>
        {playableCards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper="span"
            className={
              `${scoringCards.includes(playableCards[index].id) ? "active-opponent-card opponent-card" : "opponent-card"} 
              ${showCards ? "spaced-opponent-card" : ""}`
            }
            src={showCards ? `/cards/${playableCards[index].id}.svg` : `/cards/dark_blue.svg`}
          />
        ))}
      </span>
    ) : (
      <span />
    );
  };

  const renderPlayedCards = () => {
    return playedCards.length ? (
      <>
        {playedCards.map((card, index) => (
          <ReactSVG
            id={card}
            className='opponent-played-card'
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

  return (
    <>
      {scoringCards.length ? (
        <span className="opponent-score-display">{scoreDisplay}</span>
      ) : (
        <Typography variant="h5">{opponentName}</Typography>
      )}
      <Divider className='opponent-divider' variant="middle" />
      { renderCards() }
      { renderPlayedCards() }
    </>
  );
}