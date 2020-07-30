import React, { useState } from "react";
import { useSocket } from "use-socketio";
import {Divider, IconButton, makeStyles, TextField, Typography} from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';

const useStyles = makeStyles((theme) => ({
  chatMessage: {
    width: 'fit-content',
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

export const Chat = (props)  => {
  const [input, setInput] = useState('');
  const [chats, setChat] = useState([]);
  const nickname = sessionStorage.getItem('name');
  const game = sessionStorage.getItem('game');
  const classes = useStyles();

  const {socket} = useSocket("chat_message", newChat =>
      setChat([...chats, newChat])
  );

  const handleSend = e => {
    e.preventDefault();
    if (input !== '') {
      socket.emit('chat_message', {name: nickname, message: input, game: game});
      setInput('');
    }
  };

  const renderChat = () => {
    return chats.length ? (
      <div className='chat-log'>
        {chats.map(({name, message}, index) => (
          <div className={`${nickname === name ? classes.playerChatMessage : classes.chatMessage}`} key={index}>
            <Typography className={`${nickname === name ? classes.playerChatMessageContent : classes.chatMessageContent}`} color='textPrimary'>
              { message }
            </Typography>
            <Typography className='chat-message-name' color="textSecondary" gutterBottom variant="body2" component="p">
              { name }
            </Typography>
          </div>
        ))}
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
          <TextField id="m" variant="outlined" style ={{width: '100%'}} inputstyle ={{width: '100%'}} onChange={e => setInput(e.target.value.trim())}/>
          <IconButton className="send-message" onClick={handleSend} aria-label="leave">
            <SendIcon fontSize="inherit" />
          </IconButton>
        </form>
      </div>
    </>
  );
};