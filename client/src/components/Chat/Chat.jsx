import React, { useEffect, useRef, useState } from "react";

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';

import { socket } from "../../socket";
import './Chat.css'


export const Chat = ()  => {
  const [chats, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const nickname = sessionStorage.getItem('name');
  const room = sessionStorage.getItem('room');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: "smooth"});
    }
  };
  useEffect(scrollToBottom, [chats]);

  useEffect(() => {
    function onChat(value) {
      console.log(value)
      setChat([...chats, value]);
    }

    socket.on('chat', onChat);

    return () => {
      socket.off('chat', onChat);
    };
  }, [chats]);

  const handleChange = e => {
    setMessage(e.target.value);
    console.log(message)
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (message !== '') {
      console.log('sent')
      socket.emit('chat_message', {name: nickname, message: message, room: room});
    }
    document.getElementById('message-input').value = '';
    setMessage('');
  };

  const renderChat = () => {
    return chats.length ? (
      <div id='chat-log' className='chat-log'>
        {chats.map(({name, message}, index) => (
            name === 'game-updater' ? (
              <div key={index} className='game-update' color='textPrimary'>
                { message }
              </div>
            ) : (
              <div key={index}>
                <div color='textPrimary'>
                  { message }
                </div>
                {nickname !== name ?
                  <div color="textSecondary">
                    {name}
                  </div> : <span />
                }
              </div>
            )
        ))}
        <div ref={messagesEndRef} />
      </div>
    ) : (
      <p/>
    );
  };

  return (
    <>
      <div className="game-name">Game: { room }</div>
      <Divider variant="middle"/>
      { renderChat() }
      <div>
        <form onSubmit={handleSubmit}>
          <input
            id="message-input"
            type="text"
            value={message}
            onChange={handleChange}
          />
          <IconButton style={{"outline": "none", "boxShadow": "none"}} className='send-message-button' onClick={handleSubmit}>
            <SendIcon fontSize="inherit" />
          </IconButton>
        </form>
      </div>
    </>
  );
};