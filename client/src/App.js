import React, { useState, useEffect } from 'react';
import { SocketIOProvider, useSocket } from "use-socketio";
import { TextField, Button, IconButton } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

import './App.css';

const Game = ()  => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [input, setInput] = useState('');
  const [chats, setChat] = useState([]);

  const { socket, subscribe, unsubscribe } = useSocket("chat_message", newChat =>
    setChat([...chats, newChat])
  );

  const handleJoin = e => {
    e.preventDefault();
    if (!name) {
      return alert("Name can't be empty");
    }
    setId(name);
    socket.emit("player_join", {name: name, game: room});
  };

  const handleLeave = e => {
    e.preventDefault();
    socket.emit("player_leave", {name: name, game: room});
    setId('');
  };

  const handleSend = e => {
    e.preventDefault();
    if(input !== ''){
      socket.emit('chat_message', {name: id, message: input, game: room});
      setInput('');
    }
  };

  const renderChat = () => {
    return chats.length ? (
      <ul>
        {chats.map(({ name, message }, index) => (
          <li key={index}>{name}: {message}</li>
        ))}
      </ul>
    ) : (
      <p>Actually waiting for the websocket server...</p>
    );
  };

  return id ? (
    <section style={{display:'flex', flexDirection:'row'}}>
      <h4>{ room }</h4>
      <IconButton className="leave-game" onClick={handleLeave} aria-label="leave">
        <CloseIcon fontSize="inherit" />
      </IconButton>

      <ul id="messages">
        {renderChat()}
      </ul>

      <div id="sendform">
        <form onSubmit={e => handleSend(e)} style={{display: 'flex'}}>
          <TextField id="m" onChange={e=>setInput(e.target.value.trim())} />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </section>
  ) : (
    <div style={{ textAlign: 'center', margin: '30vh auto', width: '70%' }}>
      <form onSubmit={event => handleJoin(event)}>
        <TextField id="name" onChange={e => setName(e.target.value.trim())} label="name" /><br />
        <TextField id="room" onChange={e => setRoom(e.target.value.trim())} label="game" /><br />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
};

export const App = () => (
  <SocketIOProvider url="http://localhost:5000">
    <Game />
  </SocketIOProvider>
);