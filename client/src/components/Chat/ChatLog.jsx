import React from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import { IconButton, InputAdornment, makeStyles, Paper, TextField } from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";
import EmojiEmotionsIcon from '@material-ui/icons/EmojiEmotions';
import SendIcon from '@material-ui/icons/Send';

import { Picker } from 'emoji-mart'
import { customEmojis } from "./emojis";
import 'emoji-mart/css/emoji-mart.css';

const useStyles = makeStyles((theme) => ({
  root: {
    height: 'calc(100vh - 64px)',
    width: 400,
    position: 'relative',
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 57px)',
      width: 'calc(100vw - 75px)',
    }
  },
  animation: {
    backgroundRepeat: 'no-repeat',
    backgroundSize: '50px 50px',
    width: '50px',
    height: '50px'
  },
  bigMessage: {
    fontWeight: 'bold'
  },
  chat: {
    height: 'calc(100% - 60px)',
    padding: theme.spacing(1),
    overflowY: 'scroll',
    marginBottom: theme.spacing(1)
  },
  chatMessage: {
    width: 'fit-content',
  },
  chatMessageName: {
    textAlign: 'left',
    paddingLeft: theme.spacing(2)
  },
  closeEmojiMenu: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    color: 'red',
    zIndex: 2
  },
  emojiPicker: {
    position: 'absolute',
    bottom: theme.spacing(4),
    left: theme.spacing(2),
    zIndex: 1,
    textAlign: 'left',
  },
  gameUpdate: {
    textAlign: 'center',
    fontSize: 14,
    padding: '3px 0',
    fontFamily: 'helvetica'
  },
  playerChatMessage: {
    width: 'fit-content',
    marginLeft: 'auto',
    textAlign: 'right',
  },
  chatMessageContent: {
    padding: '10px',
    borderRadius: '10px',
    borderBottomLeftRadius: 0,
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontSize: 20,
    [theme.breakpoints.down('sm')]: {
      fontSize: 16
    }
  },
  playerChatMessageContent: {
    padding: '10px',
    borderRadius: '10px',
    borderBottomRightRadius: 0,
    color: 'eggshell',
    background: '#1982FC',
    fontSize: 20,
    [theme.breakpoints.down('sm')]: {
      fontSize: 16
    }
  },
  pointsMessage: {
    color: '#0288d1'
  },
  messageField: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    background: theme.palette.background.paper,
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  }
}));

export const ChatLog = ()  => {
  const classes = useStyles();
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [showEmojis, setShowEmojis] = React.useState(false);
  const messagesEndRef = React.useRef(null);
  
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });
  
  const nickname = localStorage.getItem('cribbage-live-name');
  const game = localStorage.getItem('cribbage-live-game');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: "smooth"});
    }
  };
  React.useEffect(scrollToBottom, [messages]);

  const { socket } = useSocket("chat", newMessage => {
    if (newMessage.name === 'game-updater') {
      let cn;
      if (newMessage.type === 'points') {
        cn = `${classes.pointsMessage} ${classes.bigMessage}`
      } else if (newMessage.type === 'big') {
        cn = classes.bigMessage
      }
      let update = {name: newMessage.name, message: <div className={cn}>{newMessage.message}</div>};
      newMessage = update;
    }
    setMessages([...messages, newMessage]);
    boop()
  });

  useSocket("animation", animation => {
    let newMessage = {name: animation.name, message: <div className={classes.animation} style={{backgroundImage: `url(${animation.imageUrl})` }} />};
    setMessages([...messages, newMessage]);
    boop();
    handleEmojiMenu();
  });

  const handleEmojiMenu = e => {
    setShowEmojis(!showEmojis);
  };

  const addEmoji = e => {
    if (e.hasOwnProperty('imageUrl') && e.imageUrl ) {
      socket.emit('animation', {name: nickname, imageUrl: e.imageUrl, game: game});
    } else {
      setNewMessage(newMessage + ' ' + e.native);
    }
  };

  const sendMessage = e => {
    e.preventDefault();
    socket.emit("chat_message", {game: game, name: nickname, message: newMessage });
    setNewMessage('');
    document.getElementById('message-input').value = '';
  };

  const renderChat = () => {
    return messages.length && (
      <div className={classes.chat}>
        {messages.map(({name, message}, index) => (
            name === 'game-updater' ? (
              <div key={index} className={classes.gameUpdate} color='textPrimary'>
                { message }
              </div>
            ) : (
              <div className={`${nickname === name ? classes.playerChatMessage : classes.chatMessage}`} key={index}>
                <div className={`${nickname === name ? classes.playerChatMessageContent : classes.chatMessageContent}`} color='textPrimary'>
                  { message }
                </div>
                {nickname !== name &&
                  <div className={classes.chatMessageName} color="textSecondary">
                    {name}
                  </div>
                }
              </div>
            )
        ))}
        <div ref={messagesEndRef} />
      </div>
    )
  };

  return (
    <>
      <Paper className={classes.root} elevation={3} square>
        { renderChat() }
        {showEmojis && (
          <span className={classes.emojiPicker}>
            <IconButton className={classes.closeEmojiMenu} onClick={handleEmojiMenu} aria-label="leave">
              <CancelIcon fontSize="inherit" />
            </IconButton>
            <Picker
              onSelect={addEmoji}
              emojiTooltip={true}
              custom={customEmojis}
              exclude={['smileys', 'nature', 'objects', 'flags', 'places', 'activity', 'foods', 'people', 'symbols']}
            />
          </span>
        )}
        <form onSubmit={event => sendMessage(event)}>
          <TextField
            id='message-input'
            className={classes.messageField}
            fullWidth
            onChange={e => setNewMessage(e.target.value)}
            variant='outlined'
            value={newMessage}
            InputProps={{ 
              startAdornment: 
              <InputAdornment position="start">
                <IconButton
                  style={{"outline": "none"}}
                  onClick={handleEmojiMenu}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
              </InputAdornment>,
              endAdornment: 
              <InputAdornment position="end">
                <IconButton
                  style={{"outline": "none"}}
                  type='submit'
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            }} />
        </form>
      </Paper>
    </>
  )
};