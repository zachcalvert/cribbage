import React, { useState } from "react";
import { useTrail, animated } from 'react-spring';
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import useAnimateNumber from 'use-animate-number';

import {Dialog, DialogContent, DialogTitle, Divider, Fab} from "@material-ui/core";
import { ReactSVG } from 'react-svg'
import './Player.css'
import { useModal } from "react-modal-hook";
import { ViewColumn } from "@material-ui/icons";
import Chip from "@material-ui/core/Chip";

export const Player = (props) => {
  const game = localStorage.getItem('cribbage-live-game');
  const [action, setAction] = useState('');
  const [turn, setTurn] = useState(true);
  const [activeCards, setActiveCards] = useState([]);
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);

  const [peggingTotal, setPeggingTotal] = useAnimateNumber(0, {decimals: 0});
  const [showPeggingTotal, setShowPeggingTotal] = useState(false);
  const [cribHelpText, setCribHelpText] = useState(null);
  const [scoring, setScoring] = useState(false);

  const [open, setOpen] = useState(false);
  const [jokerSuit, setJokerSuit] = useState(null);
  const [jokerRank, setJokerRank] = useState(null);

  // dealt card animation
  const config = { mass: 5, tension: 2000, friction: 100 }
  const trail = useTrail(playableCards.length, {
    config,
    opacity: playableCards ? 1 : 1,
    x: playableCards ? 0 : 20,
    height: playableCards ? 20 : 0,
    from: { opacity: 1, x: 20, height: 0 },
  });

  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const { socket } = useSocket("send_turn", msg => {
    setScoring(false);
    setActiveCards([]);
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
    if (msg.action === 'discard') {
      msg.crib === props.name
      ? (setCribHelpText('your crib'))
      : (setCribHelpText(`${msg.crib}'s crib`))
    } else if (msg.action === 'cut') {
      setCribHelpText(null);
    }
  });

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
      setPlayedCards([]);
      if (msg.cards[props.name].includes('joker1') || msg.cards[props.name].includes('joker2')) {
        setOpen(true);
      }
    }
  });

  useSocket("send_cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
      if (msg.cards[props.name].includes('joker1') || msg.cards[props.name].includes('joker2')) {
        setOpen(true);
      }
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
    setShowPeggingTotal(true);
    setPeggingTotal(msg.pegging_total);
  });

  useSocket("points", msg => {
    if (msg.reason === 'go') {
      setPeggingTotal(0);
    }
  });

  useSocket("display_score", msg =>{
    if (props.name === msg.player) {
      setScoring(true);
      setAction(msg.text);
      setActiveCards(msg.cards);
    }
  });

  useSocket('invalid_card', msg => {
    setActiveCards([]);
  });

  useSocket('invalid_joker', msg => {
    setOpen(true);
  });

  useSocket('pegging_total', msg => {
    setPeggingTotal(msg.pegging_total);
  })

  const handleAction = (e) => {
    setTurn(false);

    boop();
    if (action === 'discard' && (playableCards.length - activeCards.length < 4)) {
      socket.emit('chat_message', {name: 'game-updater', message: `Whoops! Too many cards selected for discard`, game: game, private: true});
      setActiveCards([]);
      return;
    }
    if ((action === 'play' || action ==='discard') && (!activeCards.length)) {
      socket.emit('chat_message', {name: 'game-updater', message: `Psst! Select a card to ${action} by clicking on it`, game: game, private: true});
      return;
    }
    if (action === 'next') {
      setPlayableCards([])
    }
    socket.emit(action, { game: game, player: props.name, card: activeCards[0], second_card: activeCards[1]});
    document.activeElement.blur();
  };

  const handleCardClick = (e) => {
    let card = e.target.parentNode.parentNode.parentNode.id;  // :(
    if (action === 'discard') {
      activeCards.includes(card) ? (
        setActiveCards(activeCards.filter(item => item !== card))
      ) : (
        setActiveCards([...activeCards, card])
      )
    } else {
      card === activeCards[0] ? (
          setActiveCards([])
      ) : (
          setActiveCards([card])
      )
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
        {trail.map(({ x, height, ...rest }, index) => (
          <animated.div
            key={playableCards[index]}
            className="trails-text"
            style={{ ...rest, transform: x.interpolate(x => `translate3d(0,${x}px,0)`) }}>
            <animated.div style={{ height }}>
              <ReactSVG
                id={playableCards[index]}
                className={`${activeCards.includes(playableCards[index]) ? 'active-card available-card': 'available-card' }`}
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

  const clearSuits = () => {
    var suits = document.querySelectorAll('.selected-suit');
    for (var i = 0; i < suits.length; i++) {
      suits[i].classList.remove('selected-suit')
    }
  };

  const clearRanks = () => {
    var ranks = document.querySelectorAll('.selected-rank');
    for (var i = 0; i < ranks.length; i++) {
      ranks[i].classList.remove('selected-rank')
    }
  };

  const handleSuitSelection = (e) => {
    clearSuits();
    e.target.classList.add('selected-suit');
    setJokerSuit(e.target.getAttribute('data-value'));
  };

  const handleRankSelection = (e) => {
    clearRanks();
    e.target.classList.add('selected-rank');
    setJokerRank(e.target.getAttribute('data-value'));
  };

  const handleJokerSelection = (e) => {
    socket.emit('joker_selected', { game: game, player: props.name, rank: jokerRank, suit: jokerSuit });
    setOpen(false);
    setJokerSuit(null);
    setJokerRank(null);
    clearRanks();
    clearSuits();
  };

  return (
    <>
      <Dialog className="cards-modal" open={open} onClose={false}>
        <DialogTitle>
          You got a joker!
        </DialogTitle>
        <DialogContent>
          <span>You can turn it into any card that's not already in your hand.</span>
          <br />
          <div className='joker-rank-row'>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="ace">A</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="two">2</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="three">3</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="four">4</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="five">5</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="six">6</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="seven">7</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="eight">8</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="nine">9</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="ten">10</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="jack">J</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="queen">Q</span>
            <span className='joker-rank-selection' onClick={handleRankSelection} data-value="king">K</span>
          </div>
          <div className="joker-suit-selection-row">
            <img style={{width: '25%'}} data-value="hearts" alt='hearts' onClick={handleSuitSelection} src="/cards/hearts"/>
            <img style={{width: '25%'}} data-value="spades" alt='spades' onClick={handleSuitSelection} src="/cards/spades"/>
            <img style={{width: '25%'}} data-value="diamonds" alt='diamonds' onClick={handleSuitSelection} src="/cards/diamonds"/>
            <img style={{width: '25%'}} data-value="clubs" alt='clubs' onClick={handleSuitSelection} src="/cards/clubs"/>
          </div>
          <span></span>
          <button id="select-joker" disabled={!jokerSuit || !jokerRank} className="joker-submit-button btn btn-default btn-primary btn-block" onClick={handleJokerSelection}>
            Make my joker the {jokerRank} of {jokerSuit}
          </button>
        </DialogContent>
      </Dialog>

      <div className='row player-header'>
        <div className='col-3 played-cards'>
          { renderPlayedCards() }
        </div>
        {action ? <div className='col-6'>
          <Fab variant="extended"
            className={scoring ? "scoring-button action-button" : "action-button"}
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
          {cribHelpText ?
            <Chip
              className='crib-help-chip'
              icon={<ViewColumn />}
              label={cribHelpText}
              color={cribHelpText.includes('your') ? 'primary' : 'secondary'}
              variant="sharp"
            /> : <span/>
           }
        </div>
      </div>
      <Divider variant="middle" />
      <div className="player-cards">
        { renderPlayableCards() }
      </div>
    </>
  );
};