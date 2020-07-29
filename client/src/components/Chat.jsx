import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { Divider, IconButton, TextField, Typography } from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';

export const Chat = (props)  => {
  const [input, setInput] = useState('');
  const [chats, setChat] = useState([]);
  const name = sessionStorage.getItem('name');
  const game = sessionStorage.getItem('game');

  const {socket} = useSocket("chat_message", newChat =>
      setChat([...chats, newChat])
  );

  const handleSend = e => {
    e.preventDefault();
    if (input !== '') {
      socket.emit('chat_message', {name: name, message: input, game: game});
      setInput('');
    }
  };

  const renderChat = () => {
    return chats.length ? (
      <div className='chat-log'>
        {chats.map(({name, message}, index) => (
          <div className='chat-message' key={index}>
            <Typography className='chat-message-content' gutterBottom>
              { message }
            </Typography>
            <Typography className='chat-message-name' color="textSecondary" variant="body2" component="p">
              { name }
            </Typography>
          </div>
        ))}
      </div>
    ) : (
        <p>Actually waiting for the websocket server...</p>
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