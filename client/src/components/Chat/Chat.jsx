import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";

import { Divider, IconButton, makeStyles } from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";

import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

import { customEmojis } from "./emojis";
import './Chat.css'


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
    if (newChat.name === 'game-updater') {
      let update = {name: newChat.name, message: <div className='update'>{newChat.message}</div>};
      newChat = update;
    }
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

            <div className={`${nickname === name ? classes.playerChatMessageContent : classes.chatMessageContent}`} color='textPrimary'>
              { message }
            </div>
            {nickname !== name && name !== 'game-updater' ?
              <div className={classes.chatMessageName} color="textSecondary">
                {name}
              </div> : <span />
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
        {showEmojis ? (
          <span className='emoji-picker'>
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
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            id="message-input"
            style={styles.input}
            type="text"
            value={message}
            onChange={handleChange}
          />
        </form>
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: 20,
    borderTop: "1px #4C758F solid",
    display: "inline-flex",
    width: "100%"
  },
  form: {
    display: "flex",
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
    border: "none",
    margin: 0,
    cursor: "pointer",
    padding: "0 20px 0 0"
  }
};