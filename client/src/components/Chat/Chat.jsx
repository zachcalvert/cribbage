import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "use-socketio";
import { Divider, IconButton, makeStyles, TextField, Typography } from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';
import useSound from "use-sound";
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
  const [message, setMessage] = useState('');
  const [chats, setChat] = useState(['Welcome!']);
  const nickname = sessionStorage.getItem('name');
  const game = sessionStorage.getItem('game');
  const classes = useStyles();

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [chats]);

  const { socket } = useSocket("chat_message", newChat => {
    setChat([...chats, newChat]);
    boop()
  });

  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });

  const handleSend = e => {
    e.preventDefault();
    if (message !== '') {
      socket.emit('chat_message', {name: nickname, message: message, game: game});
    }
    setMessage('');
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
      {renderChat()}
      <div className="send-form">
        <form onSubmit={e => handleSend(e)} style={{display: 'flex'}}>
          <TextField id="m" variant="outlined" style ={{width: '100%'}} inputstyle ={{width: '100%'}} onChange={e => setMessage(e.target.value.trim())}/>
          <IconButton className="send-message" onClick={handleSend} aria-label="leave">
            <SendIcon fontSize="inherit" />
          </IconButton>
        </form>
      </div>
    </>
  );
};