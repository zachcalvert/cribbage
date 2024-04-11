import React, { useEffect, useRef, useState } from "react";
import { styled } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from "@mui/material/TextField";
import Typography from '@mui/material/Typography';

import SendIcon from '@mui/icons-material/Send';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { socket } from "../../socket";
import './Chat.css';

const drawerWidth = 300;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start',
}));

export function Chat() {
  const [open, setOpen] = useState(true);
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
                  <strong>{name}</strong>: { message }
                </div>
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
      open ? (
        <Drawer
          sx={{
            width: drawerWidth,
            flexGrow: 1,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
            '& .MuiDrawer-root': {
              position: 'absolute',
            },
            '& .MuiPaper-root': {
              position: 'absolute',
              height: '400px',
              marginLeft: 'auto',
              marginRight: '1rem',
            },
          }}
          variant="persistent"
          anchor="bottom"
          open={open}
        >
        <DrawerHeader>
          <Typography variant="h6">Chat</Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ transform: "scale(1.5)", position: "fixed", right: "2rem"}}>
            <KeyboardArrowDownIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        { renderChat() }

        <form onSubmit={handleSubmit} className="send-message-form">
          <TextField
            value={message}
            onChange={handleChange}
            size="small"
            sx={{ width: '100%' }}
            id="message-input"
              InputProps={{
                endAdornment: <InputAdornment position="end">
                <IconButton style={{"outline": "none", "boxShadow": "none"}} onClick={handleSubmit}>
                  <SendIcon fontSize="inherit" />
                </IconButton>
              </InputAdornment>,
              }}
          />
        </form>
      </Drawer>
    ) : (
      <div className="open-chat-container">
        <div className="open-chat">
          <Typography variant="h6" sx={{ float: 'left'}}>Chat</Typography>
          <IconButton sx={{ float: 'right', transform: "scale(1.5)", "outline": "none", "boxShadow": "none"}} onClick={() => setOpen(true)}>
            <KeyboardArrowUpIcon fontSize="32px" />
          </IconButton>
        </div>
      </div>
    )
  );
}