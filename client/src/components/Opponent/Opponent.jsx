import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { ReactSVG } from 'react-svg'
import { Divider, makeStyles } from "@material-ui/core";
import './Opponent.css'

const useStyles = makeStyles((theme) => ({
  opponent: {
    padding: theme.spacing(1),
  },
}));

export const Opponent = (props) => {
  const classes = useStyles();
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [scoringCards, setScoringCards] = useState([]);
  const [scoreDisplay, setScoreDisplay] = useState('');

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
      setPlayedCards([]);
    }
    msg.show_to_all === true ? ( setShowCards(true)) : ( setShowCards(false))
  });

  useSocket("send_cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
    }
    if (props.name in msg.played_cards) {
      setPlayedCards(msg.played_cards[props.name]);
    }
  });

  useSocket("card_played", msg => {
    if (props.name === msg.player) {
      setPlayableCards(playableCards.filter(card => card !== msg.card));
      setPlayedCards([...playedCards, msg.card]);
    }
  });

  useSocket("display_score", msg => {
    if (props.name === msg.player) {
      setScoreDisplay(msg.text);
      setScoringCards(msg.cards);
    }
  });

  useSocket('send_turn', msg => {
    setScoringCards([]);
  });

  const renderCards = () => {
    return playableCards.length && (
      <span>
        {playableCards.map((card, index) => (
          <ReactSVG
            key={index}
            wrapper='span'
            className={`${scoringCards.includes(playableCards[index]) ? "active-opponent-card opponent-card" : "opponent-card"} 
            ${showCards && "overlapping-card"}`}
            src={ showCards ? `/cards/${playableCards[index]}.svg` : `/cards/wide_red_stripes.svg`}
          />
        ))}
      </span>
    )
  };

  const renderPlayedCards = () => {
    return playedCards.length && (
      <>
        {playedCards.map((card, index) => (
          <ReactSVG
            id={card}
            key={index}
            wrapper='span'
            src={`/cards/${card}.svg`}
          />
        ))}
      </>
    )
  };

  return (
    <div className={classes.opponent}>
      {scoringCards.length ? (
        <span className="opponent-score-display">{ scoreDisplay }</span>
        ) : <span>{props.name}</span>
      }
      <Divider className='opponent-divider' variant="middle" />
      { renderCards() }
      { renderPlayedCards() }
    </div>
  );
}