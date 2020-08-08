import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "use-socketio";
import { Divider, IconButton, makeStyles, TextField, Typography } from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';
import useSound from "use-sound";
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


const customEmojis = [
  {
    name: 'Octocat',
    short_names: ['octocat'],
    text: '',
    emoticons: [],
    keywords: ['github'],
    imageUrl: 'https://github.githubassets.com/images/icons/emoji/octocat.png',
    customCategory: 'GitHub'
  },
  {
    name: 'Meow Avicii',
    short_names: ['meow_avicii'],
    keywords: ['meow', 'avicii'],
    imageUrl: 'emojis/meows/avicii.gif',
    customCategory: 'meows'
  },
]

export const Chat = ()  => {
  const [message, setMessage] = useState('');
  const [chats, setChat] = useState([]);
  const [showEmojis, setShowEmojis] = useState([]);
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

  const handleSend = e => {
    e.preventDefault();
    if (message !== '') {
      socket.emit('chat_message', {name: nickname, message: message, game: game});
    }
    document.getElementById('message-input').value = '';
    setMessage('');
  };

  const addEmoji = e => {
    // console.log(e.native);
    let emoji = e.native;
    setMessage(message + emoji );
  };

  const closeMenu = e => {
    setShowEmojis(false);
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

  const renderPicker = () => {
    if (showEmojis.length === 0) {
      return (
        <p className='show-emoji-picker' onClick={setShowEmojis(['test'])}>
          {String.fromCodePoint(0x1f60a)}
        </p>
      )
    } else {
      return (
        <span className='emoji-picker'>
          <Picker
            onSelect={addEmoji}
            custom={customEmojis}
            emojiTooltip={true}
            title=''
          />
        </span>
      )}
  }

  return (
    <>
      <div className="game-name">Game: { game }</div>
      <Divider variant="middle"/>
      {renderChat()}
      <div className="send-form">
        { renderPicker() }
        <form onSubmit={e => handleSend(e)} style={{display: 'flex'}}>
          <TextField id="message-input" variant="outlined" style ={{width: '100%'}} inputstyle={{width: '100%'}} onChange={e => setMessage(e.target.value.trim())}>{ message }</TextField>
          <IconButton className="send-message" onClick={handleSend} aria-label="leave">
            <SendIcon fontSize="inherit" />
          </IconButton>
        </form>
      </div>
    </>
  );
};