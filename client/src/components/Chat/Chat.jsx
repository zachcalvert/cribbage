import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";
import { Divider, IconButton, makeStyles, TextField, Typography } from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";
import './Chat.css'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'


const useStyles = makeStyles((theme) => ({
  chatMessage: {
    width: 'fit-content',
  },
  chatMessageName: {
    paddingLeft: '5px',
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
    background: theme.palette.background.default

  },
  playerChatMessageContent: {
    padding: '10px',
    borderRadius: '10px',
    borderBottomRightRadius: 0,
    color: 'white',
    background: '#1982FC'
  }
}));

export const Chat = ()  => {
  const [chats, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });
  const classes = useStyles();

  const nickname = sessionStorage.getItem('name');
  const game = sessionStorage.getItem('game');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: "smooth"});
    }
  };
  useEffect(scrollToBottom, [chats]);

  const { socket } = useSocket("chat_message", newChat => {
    setChat([...chats, newChat]);
    boop()
  });

  useSocket("animation", animation => {
    let newChat = {name: animation.name, message: <div className='animation' style={{backgroundImage: `url(${animation.imageUrl})` }} />};
    setChat([...chats, newChat]);
    boop()
    closeEmojiMenu();
  });


  const displayEmojiMenu = e => {
    setShowEmojis(true);
    document.addEventListener('click', {closeEmojiMenu});
  };

  const closeEmojiMenu = e => {
    setShowEmojis(false);
    document.removeEventListener('click', {closeEmojiMenu});
  };

  const handleChange = e => {
    setMessage(e.target.value);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (message !== '') {
      socket.emit('chat_message', {name: nickname, message: message, game: game});
    }
    document.getElementById('message-input').value = '';
    setMessage('');
  };

  const addEmoji = e => {
    if (e.hasOwnProperty('imageUrl') && e.imageUrl ) {
      socket.emit('animation', {name: nickname, imageUrl: e.imageUrl, game: game});
    }
    else {
      setMessage(message + ' ' + e.native);
      document.getElementById('message-input').value = '';
    }
  };

  const renderChat = () => {
    return chats.length ? (
      <div id='chat-log' className='chat-log'>
        {chats.map(({name, message}, index) => (
          <div className={`${nickname === name ? classes.playerChatMessage : classes.chatMessage}`} key={index}>

            <Typography className={`${nickname === name ? classes.playerChatMessageContent : classes.chatMessageContent}`} color='textPrimary'>
              { message }
            </Typography>
            {nickname !== name ?
              <Typography className={classes.chatMessageName} color="textSecondary" gutterBottom variant="body2" component="p">
                {name}
              </Typography> : <span />
            }
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    ) : (
      <p/>
    );
  };

  return (
    <>
      <div className="game-name">Game: { game }</div>
      <Divider variant="middle"/>
      { renderChat() }
      <div style={styles.container} className="newMessageForm">
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            id="message-input"
            style={styles.input}
            type="text"
            value={message}
            onChange={handleChange}
            placeholder="Type a message and hit ENTER"
          />
        </form>
        {showEmojis ? (
          <span style={styles.emojiPicker}>
            <IconButton className="close-emoji-menu" onClick={closeEmojiMenu} aria-label="leave">
              <CancelIcon fontSize="inherit" />
            </IconButton>
            <Picker
              onSelect={addEmoji}
              emojiTooltip={true}
              custom={customEmojis}
            />
          </span>
        ) : (
          <p style={styles.getEmojiButton} onClick={displayEmojiMenu}>
            {String.fromCodePoint(0x1f60a)}
          </p>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: 20,
    borderTop: "1px #4C758F solid",
    marginBottom: 20
  },
  form: {
    display: "flex"
  },
  input: {
    color: "inherit",
    background: "none",
    outline: "none",
    border: "none",
    flex: 1,
    fontSize: 16
  },
  getEmojiButton: {
    cssFloat: "left",
    border: "none",
    margin: 0,
    cursor: "pointer"
  },
  emojiPicker: {
    position: "absolute",
    bottom: 10,
    right: 0,
    cssFloat: "right",
    marginLeft: "15px",
    marginBottom: "80px",
  }
};

const customEmojis = [
  {
    name: 'Meow Avicii',
    short_names: ['meow_avicii'],
    keywords: ['meow', 'avicii'],
    text: '',
    emoticons: [],
    imageUrl: 'emojis/meows/avicii.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Bongo',
    short_names: ['meow_bongo'],
    keywords: ['meow', 'bongo'],
    imageUrl: 'emojis/meows/bongo.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Bounce',
    short_names: ['meow_bounce'],
    keywords: ['meow', 'bounce'],
    imageUrl: 'emojis/meows/bounce.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow gimme',
    short_names: ['meow_gimme'],
    keywords: ['meow', 'gimme'],
    imageUrl: 'emojis/meows/gimme.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow hero',
    short_names: ['meow_hero'],
    keywords: ['meow', 'hero'],
    imageUrl: 'emojis/meows/hero.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow maracas',
    short_names: ['meow_maracas'],
    keywords: ['meow', 'maracas'],
    imageUrl: 'emojis/meows/maracas.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow party',
    short_names: ['meow_party'],
    keywords: ['meow', 'party'],
    imageUrl: 'emojis/meows/party.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow peekaboo',
    short_names: ['meow_peekaboo'],
    keywords: ['meow', 'peekaboo'],
    imageUrl: 'emojis/meows/peekaboo.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow popcorn',
    short_names: ['meow_popcorn'],
    keywords: ['meow', 'popcorn'],
    imageUrl: 'emojis/meows/popcorn.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow rage',
    short_names: ['meow_rage'],
    keywords: ['meow', 'rage'],
    imageUrl: 'emojis/meows/rage.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Wat',
    short_names: ['meow_wat'],
    keywords: ['meow', 'wat'],
    imageUrl: 'emojis/meows/wat.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow shocked',
    short_names: ['meow_shocked'],
    keywords: ['meow', 'shocked'],
    imageUrl: 'emojis/meows/shocked.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow sip',
    short_names: ['meow_sip'],
    keywords: ['meow', 'sip'],
    imageUrl: 'emojis/meows/sip.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow smug',
    short_names: ['meow_smug'],
    keywords: ['meow', 'smug'],
    imageUrl: 'emojis/meows/smug.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow stretch',
    short_names: ['meow_stretch'],
    keywords: ['meow', 'stretch'],
    imageUrl: 'emojis/meows/stretch.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow thinking',
    short_names: ['meow_thinking'],
    keywords: ['meow', 'thinking'],
    imageUrl: 'emojis/meows/thinking.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow wave',
    short_names: ['meow_wave'],
    keywords: ['meow', 'wave'],
    imageUrl: 'emojis/meows/wave.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Wat',
    short_names: ['meow_wat'],
    keywords: ['meow', 'wat'],
    imageUrl: 'emojis/meows/wat.gif',
    customCategory: 'meows'
  }
];