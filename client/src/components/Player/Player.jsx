import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import { useTrail, animated } from 'react-spring'

import {Dialog, DialogContent, DialogTitle, Divider, Fab} from "@material-ui/core";
import { ReactSVG } from 'react-svg'
import './Player.css'
import { useModal } from "react-modal-hook";
import ViewColumnIcon from '@material-ui/icons/ViewColumn';
import Typography from "@material-ui/core/Typography";
import {ViewColumn} from "@material-ui/icons";
import Chip from "@material-ui/core/Chip";

export const Player = (props) => {
  const game = sessionStorage.getItem('game');
  const [action, setAction] = useState('');
  const [turn, setTurn] = useState(true);
  const [activeCard, setActiveCard] = useState('');
  const [activeSecondCard, setActiveSecondCard] = useState(null);
  const [playableCards, setPlayableCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [peggingTotal, setPeggingTotal] = useState(0);
  const [showPeggingTotal, setShowPeggingTotal] = useState(false);
  const [cribHelpText, setCribHelpText] = useState(null);

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
    setActiveCard('');
    setActiveSecondCard('');
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
      {
        msg.crib === props.name ? (
            setCribHelpText('yours')
        ) : (setCribHelpText(`${msg.crib}\'s`))
      }
    } else if (msg.action === 'cut') {
        setCribHelpText(null);
    }
  });

  useSocket("cards", msg => {
    if (props.name in msg.cards) {
      setPlayableCards(msg.cards[props.name]);
      setPlayedCards([]);
      if (msg.cards[props.name].includes('joker1') || msg.cards[props.name].includes('joker2')) {
        showJokerModal();
      }
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
    if (action === 'discard' && activeSecondCard && playableCards.length <= 5) {
      socket.emit('chat_message', {name: 'game-updater', message: `Whoops! Too many cards selected for discard`, game: game, private: true});
      return;
    }
    if ((action === 'play' || action ==='discard') && !(activeCard)) {
      socket.emit('chat_message', {name: 'game-updater', message: `Psst! Select a card to ${action} by clicking on it`, game: game, private: true});
      return;
    }
    if (action === 'next') {
      setPlayableCards([])
    }
    socket.emit(action, { game: game, player: props.name, card: activeCard, second_card: activeSecondCard});
    document.activeElement.blur();
  };

  const handleCardClick = (e) => {
    let card = e.target.parentNode.parentNode.parentNode.id;  // :(
    if (activeCard && action === 'discard') {
      card === activeCard ? (
        setActiveCard('')
      ) : (
        setActiveSecondCard(card)
      )
      card === activeSecondCard ? (
        setActiveSecondCard(null)
      ) : (console.log('dsf'))
    } else {
      card === activeCard ? (
          setActiveCard('')
      ) : (
          setActiveCard(card)
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
                className={activeCard === playableCards[index] || activeSecondCard === playableCards[index] ? 'active-card available-card': 'available-card' }
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
    hideJokerModal();
    setJokerSuit(null);
    setJokerRank(null);
    clearRanks();
    clearSuits();
  };

  const [showJokerModal, hideJokerModal] = useModal(({in: open, onExited}) => (
    <>
      <Dialog className="cards-modal" open={open} onExited={hideJokerModal} onClose={false}>
        <DialogTitle>
          You got a joker!
        </DialogTitle>
        <DialogContent>
          <span>You can turn it into any card you like.</span>
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
            <img style={{width: '25%'}} data-value="hearts" onClick={handleSuitSelection} src="/cards/hearts"/>
            <img style={{width: '25%'}} data-value="spades" onClick={handleSuitSelection} src="/cards/spades"/>
            <img style={{width: '25%'}} data-value="diamonds" onClick={handleSuitSelection} src="/cards/diamonds"/>
            <img style={{width: '25%'}} data-value="clubs" onClick={handleSuitSelection} src="/cards/clubs"/>
          </div>
          <span></span>
          <button id="select-joker" disabled={!jokerSuit || !jokerRank} className="joker-submit-button btn btn-default btn-primary btn-block" onClick={handleJokerSelection}>
            Make my joker the {jokerRank} of {jokerSuit}
          </button>
        </DialogContent>
      </Dialog>
    </>
  ), [jokerRank, jokerSuit]);

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