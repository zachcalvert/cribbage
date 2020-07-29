import React, { useState } from "react";
import { useSocket } from "use-socketio";
import {Button, Paper, TextField, Divider, IconButton} from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';
import CloseIcon from "@material-ui/icons/Close";

export const Chat = (props)  => {
  const [input, setInput] = useState('');
  const [chats, setChat] = useState([]);
  const name = props.name;

  const {socket} = useSocket("chat_message", newChat =>
      setChat([...chats, newChat])
  );

  const handleSend = e => {
    e.preventDefault();
    if (input !== '') {
      socket.emit('chat_message', {name: name, message: input, game: props.game});
      setInput('');
    }
  };

  const renderChat = () => {
    return chats.length ? (
        <div className='chat-log'>
          {chats.map(({name, message}, index) => (
              <p key={index}>{name}: {message}</p>
          ))}
        </div>
    ) : (
        <p>Actually waiting for the websocket server...</p>
    );
  };

  return (
    <>
      <div className="game-name">Game: { props.game }</div>
      <Divider variant="middle"/>
      {renderChat()}
      <div className="send-form">
        <form onSubmit={e => handleSend(e)} style={{display: 'flex'}}>
          <TextField id="m" variant="outlined" style ={{width: '100%'}} inputStyle ={{width: '100%'}} onChange={e => setInput(e.target.value.trim())}/>
          <IconButton className="send-message" onClick={handleSend} aria-label="leave">
            <SendIcon fontSize="inherit" />
          </IconButton>
        </form>
      </div>
    </>
  );
};