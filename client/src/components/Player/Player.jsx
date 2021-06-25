import React, { useState } from "react";
import { useSocket } from "use-socketio";
import useSound from 'use-sound';
import useAnimateNumber from 'use-animate-number';

import { Button, Chip, Dialog, DialogContent, DialogTitle, Divider, Grid, makeStyles } from "@material-ui/core";
import { ReactSVG } from 'react-svg'
import './Player.css'
import { ViewColumn } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  player: {
    padding: theme.spacing(2),
    height: '40%',
    textAlign: 'center',
    bottom: 0
  },
  actionButton: {
    margin: theme.spacing(2),
  },
  card: {
    width: '7em',
    height: 'auto',
    padding: 0,
    margin: '-30px',
    [theme.breakpoints.down('sm')]: {
      width: '6.5em',
      margin: '-30px',
    }
  },
  divider: {
    width: 'auto',
    margin: '0 0 5px!important',
    background: theme.palette.secondary.main
  },
  playedCard: {
    width: '6em',
    height: 'auto',
    padding: 0,
    margin: '0 0 0 -65px',
  },
  cardsContainer: {
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'center',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,  minmax(10px, max-content))',
  },
  cribChip: {
    marginTop: theme.spacing(3)
  },
  peggingTotal: {
    marginTop: '1rem',
    fontSize: '32px',
    color: '#009688'
  },
  playedCards: {
    margin: 'auto'
  }
}));

export const Player = (props) => {
  const classes = useStyles();
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

  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const { socket } = useSocket("send_turn", msg => {
    setScoring(false);
    setActiveCards([]);
    if (msg.players.includes(props.name)) {
      setTurn(true);
      setAction(msg.action);
    } else {
      setTurn(false);
      setAction(`${msg.players}...`)
    }
    if (msg.action === 'play' || msg.action === 'pass') {
      setShowPeggingTotal(true);
    } else {
      setShowPeggingTotal(false);
    }
    if (msg.action === 'discard') {
      msg.crib === props.name
      ? (setCribHelpText('yours'))
      : (setCribHelpText(`${msg.crib}'s`))
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
    if (action === 'discard') {
      setTurn(true)
    }
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
      setTurn(true);
      return;
    }
    if ((action === 'play' || action ==='discard') && (!activeCards.length)) {
      socket.emit('chat_message', {name: 'game-updater', message: `Psst! Select a card to ${action} by clicking on it`, game: game, private: true});
      setTurn(true);
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
            className={`played-card ${classes.playedCard}`}
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
    if (playableCards.length) {
      return (
        <>
          {playableCards.map((card, index) => (
            <ReactSVG
              id={playableCards[index]}
              className={`${activeCards.includes(playableCards[index]) ? `active-card ${classes.card}`: classes.card }`}
              key={index}
              onClick={handleCardClick}
              wrapper='span'
              src={`/cards/${playableCards[index]}.svg`}
            />
          ))}
        </>
      )
    }
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
      <Dialog className="joker-modal" open={open} onClose={false}>
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

      <Grid container className={classes.player}>
        <Grid item xs={3} className={`${classes.playedCards} ${classes.cardsContainer}`}>
          { renderPlayedCards() }
        </Grid>
        {action && <Grid item xs={6}>
          <Button variant='contained' color='primary'
            className={scoring ? `scoring-button ${classes.actionButton}` : classes.actionButton}
            onClick={handleAction}
            disabled={!turn}>
            { action }
          </Button>
        </Grid>}
        <Grid className={classes.peggingTotal} item xs={3}>
          {showPeggingTotal ? 
            <span >{peggingTotal}</span> : <span />
          }
          {cribHelpText ?
            <Chip
              className={classes.cribChip}
              icon={<ViewColumn />}
              label={cribHelpText}
              color='#00695f'
              variant="outlined"
            /> : <span />
           }
        </Grid>
        <Divider className={classes.divider} variant="middle"/>
        <Grid item xs={12} className={classes.cardsContainer}>
          { renderPlayableCards() }
        </Grid>
      </Grid>
    </>
  );
};