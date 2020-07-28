import React, {useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import io from "socket.io-client";
import { Button } from "@material-ui/core";

const socket = io.connect('http://localhost:5000');

export const Chat = () => {
  const game = sessionStorage.getItem('game');
  const name = sessionStorage.getItem('name');
  const [message, setMessage] = useState('' );
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.on('chat_message', ({ game, name, message }) => {
      setChat([...chat, { game, name, message }]);
    });
  });

  const onTextChange = e => {
    setMessage(e.target.value);
  };

  const onMessageSubmit = (e) => {
    e.preventDefault();
    console.log(`sending message to room ${game} on behalf of ${name}`);
    socket.emit('chat_message', { game, name, message });
    setMessage('');
  };

  const renderChat = () => {
    return chat.map(({ name, message }, index) => (
      <div className="chat-message" key={index}>
        <span>
          {name}: {message}
        </span>
      </div>
    ))
  };

  return (
    <div className="chat">
      <form onSubmit={onMessageSubmit}>
        <h3>Send Message</h3>
        <div>
          <TextField
            id='outlined-multiline-static'
            name='message'
            label='Message'
            variant='outlined'
            onChange={e => onTextChange(e)}
            value={message}
          />
        </div>
        <Button color='primary' type='submit'>play</Button>
      </form>
      <div className="render-chat">
        <h3>Chat Log</h3>
        {renderChat()}
      </div>
    </div>
  );
}
