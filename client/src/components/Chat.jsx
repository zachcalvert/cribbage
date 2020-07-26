import React, {useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import io from "socket.io-client";

const socket = io.connect('http://localhost:5000');

export const Chat = () => {
  const [state, setState] = useState({ game: 'default', message: '', name: '' });
  const [chat, setChat] = useState([]);


  useEffect(() => {
    socket.on('chat_message', ({ game, name, message }) => {
      setChat([...chat, { game, name, message }]);
    }, []);
  });

  const onTextChange = e => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const onMessageSubmit = (e) => {
    e.preventDefault();
    const { game, name, message } = state;
    socket.emit('chat_message', { game, name, message });
    setState({game, message: '', name })
  };

  const renderChat = () => {
    return chat.map(({ name, message }, index) => (
      <div key={index}>
        <h3>
          {name}: <span>{message}</span>
        </h3>
      </div>
    ))
  };

  return (
    <div className="App">
      <form onSubmit={onMessageSubmit}>
        <h1>Messenger</h1>
        <div className="name-field">
          <TextField
              name="name"
              onChange={e => onTextChange(e)} value={state.name} label='Name' />
        </div>
        <div>
          <TextField
            id='outlined-multiline-static'
            name='message'
            label='Message'
            variant='outlined'
            onChange={e => onTextChange(e)}
            value={state.message}
          />
        </div>
        <button type='submit'>Send Message</button>
      </form>
      <div className="render-chat">
        <h1>Chat Log</h1>
        {renderChat()}
      </div>
    </div>
  );
}
