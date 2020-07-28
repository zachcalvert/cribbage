import React, { useState } from "react";
import { useSocket } from "use-socketio";
import { useSpring, animated } from 'react-spring'
import { Button, IconButton, TextField, Paper, Container } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

export const Game = ()  => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [input, setInput] = useState('');
  const [chats, setChat] = useState([]);
  const fadeIn = useSpring({opacity: 1, from: {opacity: 0}});

  const { socket } = useSocket("chat_message", newChat =>
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
      <div className='chat-log'>
        {chats.map(({ name, message }, index) => (
          <p key={index}>{name}: {message}</p>
        ))}
      </div>
    ) : (
      <p>Actually waiting for the websocket server...</p>
    );
  };

  return id ? (
    <Container className="game" height="100%" maxWidth="md">
      <IconButton className="leave-game" onClick={handleLeave} aria-label="leave">
        <CloseIcon fontSize="inherit" />
      </IconButton>

      <Paper className='left-panel'>
        <span className="room-name">Game: { room }</span>
        {renderChat()}

        <div className="send-form">
          <form onSubmit={e => handleSend(e)} style={{display: 'flex'}}>
            <TextField id="m" onChange={e=>setInput(e.target.value.trim())} />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </Paper>
    </Container>
  ) : (
    <animated.div style={fadeIn}>
    <div style={{ textAlign: 'center', margin: '30vh auto', width: '70%' }}>
      <form onSubmit={event => handleJoin(event)}>
        <TextField id="name" onChange={e => setName(e.target.value.trim())} label="name" /><br />
        <TextField id="room" onChange={e => setRoom(e.target.value.trim())} label="game" /><br />
        <Button color="primary" type="submit">Submit</Button>
      </form>
    </div>
    </animated.div>
  );
};