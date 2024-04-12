import React, { useEffect, useState } from "react";
import { useTrail, animated } from 'react-spring';
import useAnimateNumber from 'use-animate-number';

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Fab from "@mui/material/Fab";
import Chip from "@mui/material/Chip";
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

import { ReactSVG } from 'react-svg'

import { socket } from "../../socket";

import './Player.css'

export const Player = ({name}) => {
  const game = sessionStorage.getItem('room');
  const [action, setAction] = useState('');
  const [turn, setTurn] = useState(true);
  const [activeCards, setActiveCards] = useState([]);
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);

  const [peggingTotal, setPeggingTotal] = useAnimateNumber(0, {decimals: 0});
  const [showPeggingTotal, setShowPeggingTotal] = useState(false);
  const [cribHelpText, setCribHelpText] = useState(null);
  const [scoring, setScoring] = useState(false);

  const [showJokerModal, setShowJokerModal] = useState(false);
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

  useEffect(() => {
    function onSendTurn(msg) {
      setScoring(false);
      setActiveCards([]);
      if (msg.players.includes(name)) {
        setTurn(true);
        setAction(msg.action);
      } else {
        setTurn(false);
        setAction(`waiting for ${msg.players}`);
      }
      setShowPeggingTotal(msg.action === 'play' || msg.action === 'pass');
      if (msg.action === 'discard') {
        setCribHelpText(msg.crib === name ? 'your crib' : `${msg.crib}'s crib`);
      } else if (msg.action === 'cut') {
        setCribHelpText(null);
      }
    }
  
    socket.on("send_turn", onSendTurn);
  
    return () => {
      socket.off("send_turn", onSendTurn);
    };
  }, [name]);
  
  useEffect(() => {
    function onCards(msg) {
      if (name in msg.cards) {
        setPlayableCards(msg.cards[name]);
        setPlayedCards([]);
        if (msg.cards[name].includes('joker1') || msg.cards[name].includes('joker2')) {
          setShowJokerModal(true);
        }
      }
    }
  
    socket.on("cards", onCards);
  
    return () => {
      socket.off("cards", onCards);
    };
  }, [name]);
  
  useEffect(() => {
    function onPeggingTotal(msg) {
      console.log('setting pegging total')
      console.log({msg})
      setPeggingTotal(msg.pegging_total)
    }
  
    socket.on("pegging_total", onPeggingTotal);
  
    return () => {
      socket.off("pegging_total", onPeggingTotal);
    };
  }, [peggingTotal]);

  useEffect(() => {
    function onSendCards(msg) {
      console.log({msg})
      if (name in msg.cards) {
        setPlayableCards(msg.cards[name]);
        if (msg.cards[name].includes('joker1') || msg.cards[name].includes('joker2')) {
          showJokerModal();
        }
      }
      if (name in msg.played_cards) {
        setPlayedCards(msg.played_cards[name]);
      }
    }
  
    socket.on("send_cards", onSendCards);
  
    return () => {
      socket.off("send_cards", onSendCards);
    };
  }, [name]);

  const handleAction = (e) => {
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
    socket.emit(action, { game: game, player: name, card: activeCards[0], second_card: activeCards[1]});
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
    socket.emit('joker_selected', { game: game, player: name, rank: jokerRank, suit: jokerSuit });
    setShowJokerModal(false);
    setJokerSuit(null);
    setJokerRank(null);
    clearRanks();
    clearSuits();
  };

  return (
    <>
      <div className='row player-header'>
        <div className='col-3 played-cards'>
          { renderPlayedCards() }
        </div>
        {action && <div className='col-6'>
          <Fab variant="extended"
            className={scoring ? "scoring-button action-button" : "action-button"}
            color="primary"
            onClick={handleAction}
            disabled={!turn}>
            { action }
          </Fab>
          </div>
        }
        <div className='col-3'>
          {showPeggingTotal && <span className='pegging-total'>{peggingTotal}</span>}
          {cribHelpText &&
            <Chip
              className='crib-help-chip'
              icon={<ViewColumnIcon />}
              label={cribHelpText}
              color={cribHelpText.includes('your') ? 'primary' : 'secondary'}
              variant="sharp"
            />
          }
        </div>
      </div>
      <Divider variant="middle" />
      <div className="player-cards">
        { renderPlayableCards() }
      </div>

      {showJokerModal && (
        <Dialog className="cards-modal" open={showJokerModal} onClose={() => setShowJokerModal(false)}>
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
            <button id="select-joker" disabled={!jokerSuit || !jokerRank} className="joker-submit-button" onClick={handleJokerSelection}>
              Make my joker the {jokerRank} of {jokerSuit}
            </button>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
};