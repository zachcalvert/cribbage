import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "use-socketio";
import useSound from "use-sound";
import { Divider, IconButton, makeStyles } from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";
import './Chat.css'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'


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
  const [chats, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);
  const [boop] = useSound('/sounds/boop.mp3', { volume: 0.25 });
  const classes = useStyles();

  const nickname = sessionStorage.getItem('name');
  const game = sessionStorage.getItem('game');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: "smooth"});
    }
  };
  useEffect(scrollToBottom, [chats]);

  const { socket } = useSocket("chat_message", newChat => {
    if (newChat.name === 'game-updater') {
      let update = {name: newChat.name, message: <div className='update'>{newChat.message}</div>};
      newChat = update;
    }
    setChat([...chats, newChat]);
    boop()
  });

  useSocket("animation", animation => {
    let newChat = {name: animation.name, message: <div className='animation' style={{backgroundImage: `url(${animation.imageUrl})` }} />};
    setChat([...chats, newChat]);
    boop()
    closeEmojiMenu();
  });

  const displayEmojiMenu = e => {
    setShowEmojis(true);
    document.addEventListener('click', {closeEmojiMenu});
  };

  const closeEmojiMenu = e => {
    setShowEmojis(false);
    document.removeEventListener('click', {closeEmojiMenu});
  };

  const handleChange = e => {
    setMessage(e.target.value);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (message !== '') {
      socket.emit('chat_message', {name: nickname, message: message, game: game});
    }
    document.getElementById('message-input').value = '';
    setMessage('');
  };

  const addEmoji = e => {
    if (e.hasOwnProperty('imageUrl') && e.imageUrl ) {
      socket.emit('animation', {name: nickname, imageUrl: e.imageUrl, game: game});
    }
    else {
      setMessage(message + ' ' + e.native);
      document.getElementById('message-input').value = '';
    }
  };

  const renderChat = () => {
    return chats.length ? (
      <div id='chat-log' className='chat-log'>
        {chats.map(({name, message}, index) => (
          <div className={`${nickname === name ? classes.playerChatMessage : classes.chatMessage}`} key={index}>

            <div className={`${nickname === name ? classes.playerChatMessageContent : classes.chatMessageContent}`} color='textPrimary'>
              { message }
            </div>
            {nickname !== name && name !== 'game-updater' ?
              <div className={classes.chatMessageName} color="textSecondary">
                {name}
              </div> : <span />
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
      { renderChat() }
      <div style={styles.container} className="newMessageForm">
        {showEmojis ? (
          <span className='emoji-picker'>
            <IconButton className="close-emoji-menu" onClick={closeEmojiMenu} aria-label="leave">
              <CancelIcon fontSize="inherit" />
            </IconButton>
            <Picker
              onSelect={addEmoji}
              emojiTooltip={true}
              custom={customEmojis}
            />
          </span>
        ) : (
          <p style={styles.getEmojiButton} onClick={displayEmojiMenu}>
            {String.fromCodePoint(0x1f60a)}
          </p>
        )}
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            id="message-input"
            style={styles.input}
            type="text"
            value={message}
            onChange={handleChange}
            placeholder="Type a message and hit ENTER"
          />
        </form>
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: 20,
    borderTop: "1px #4C758F solid",
    display: "inline-flex",
    width: "100%"
  },
  form: {
    display: "flex",
  },
  input: {
    color: "inherit",
    background: "none",
    outline: "none",
    border: "none",
    flex: 1,
    fontSize: 16
  },
  getEmojiButton: {
    border: "none",
    margin: 0,
    cursor: "pointer",
    padding: "0 20px 0 0"
  }
};

const customEmojis = [
  {
    name: 'Meow Avicii',
    short_names: ['meow_avicii'],
    keywords: ['meow', 'avicii'],
    text: '',
    emoticons: [],
    imageUrl: 'emojis/meows/avicii.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Bongo',
    short_names: ['meow_bongo'],
    keywords: ['meow', 'bongo'],
    imageUrl: 'emojis/meows/bongo.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Bounce',
    short_names: ['meow_bounce'],
    keywords: ['meow', 'bounce'],
    imageUrl: 'emojis/meows/bounce.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow gimme',
    short_names: ['meow_gimme'],
    keywords: ['meow', 'gimme'],
    imageUrl: 'emojis/meows/gimme.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow hero',
    short_names: ['meow_hero'],
    keywords: ['meow', 'hero'],
    imageUrl: 'emojis/meows/hero.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow maracas',
    short_names: ['meow_maracas'],
    keywords: ['meow', 'maracas'],
    imageUrl: 'emojis/meows/maracas.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow party',
    short_names: ['meow_party'],
    keywords: ['meow', 'party'],
    imageUrl: 'emojis/meows/party.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow peekaboo',
    short_names: ['meow_peekaboo'],
    keywords: ['meow', 'peekaboo'],
    imageUrl: 'emojis/meows/peekaboo.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow popcorn',
    short_names: ['meow_popcorn'],
    keywords: ['meow', 'popcorn'],
    imageUrl: 'emojis/meows/popcorn.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow rage',
    short_names: ['meow_rage'],
    keywords: ['meow', 'rage'],
    imageUrl: 'emojis/meows/rage.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Wat',
    short_names: ['meow_wat'],
    keywords: ['meow', 'wat'],
    imageUrl: 'emojis/meows/wat.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow shocked',
    short_names: ['meow_shocked'],
    keywords: ['meow', 'shocked'],
    imageUrl: 'emojis/meows/shocked.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow sip',
    short_names: ['meow_sip'],
    keywords: ['meow', 'sip'],
    imageUrl: 'emojis/meows/sip.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow smug',
    short_names: ['meow_smug'],
    keywords: ['meow', 'smug'],
    imageUrl: 'emojis/meows/smug.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow stretch',
    short_names: ['meow_stretch'],
    keywords: ['meow', 'stretch'],
    imageUrl: 'emojis/meows/stretch.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow thinking',
    short_names: ['meow_thinking'],
    keywords: ['meow', 'thinking'],
    imageUrl: 'emojis/meows/thinking.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow wave',
    short_names: ['meow_wave'],
    keywords: ['meow', 'wave'],
    imageUrl: 'emojis/meows/wave.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow Wat',
    short_names: ['meow_wat'],
    keywords: ['meow', 'wat'],
    imageUrl: 'emojis/meows/wat.gif',
    customCategory: 'meows'
  },
  {
    name: 'Meow smug',
    short_names: ['meow_smug'],
    keywords: ['meow', 'smug'],
    imageUrl: 'emojis/meows/smug.gif',
    customCategory: 'meows'
  },
  {
    name: 'Blob babyangel',
    short_names: ['blob_babyangel'],
    keywords: ['blob', 'babyangel'],
    imageUrl: 'emojis/blobs/babyangel.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob bongo',
    short_names: ['blob_bongo'],
    keywords: ['blob', 'bongo'],
    imageUrl: 'emojis/blobs/bongo.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob confused',
    short_names: ['blob_confused'],
    keywords: ['blob', 'confused'],
    imageUrl: 'emojis/blobs/confused.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob conga',
    short_names: ['blob_conga'],
    keywords: ['blob', 'conga'],
    imageUrl: 'emojis/blobs/conga.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob aww',
    short_names: ['blob_aww'],
    keywords: ['blob', 'aww'],
    imageUrl: 'emojis/blobs/aww.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob cry',
    short_names: ['blob_cry'],
    keywords: ['blob', 'cry'],
    imageUrl: 'emojis/blobs/cry.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob dancer',
    short_names: ['blob_dancer'],
    keywords: ['blob', 'dancer'],
    imageUrl: 'emojis/blobs/dancer.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob dundundun',
    short_names: ['blob_dundundun'],
    keywords: ['blob', 'dundundun'],
    imageUrl: 'emojis/blobs/dundundun.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob eyeroll',
    short_names: ['blob_eyeroll'],
    keywords: ['blob', 'eyeroll'],
    imageUrl: 'emojis/blobs/eyeroll.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob gimme',
    short_names: ['blob_gimme'],
    keywords: ['blob', 'gimme'],
    imageUrl: 'emojis/blobs/gimme.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob happy',
    short_names: ['blob_happy'],
    keywords: ['blob', 'happy'],
    imageUrl: 'emojis/blobs/happy.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob nervous',
    short_names: ['blob_nervous'],
    keywords: ['blob', 'nervous'],
    imageUrl: 'emojis/blobs/nervous.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob panic',
    short_names: ['blob_panic'],
    keywords: ['blob', 'panic'],
    imageUrl: 'emojis/blobs/panic.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob party',
    short_names: ['blob_party'],
    keywords: ['blob', 'party'],
    imageUrl: 'emojis/blobs/party.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob rage',
    short_names: ['blob_rage'],
    keywords: ['blob', 'rage'],
    imageUrl: 'emojis/blobs/rage.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob smile',
    short_names: ['blob_smile'],
    keywords: ['blob', 'smile'],
    imageUrl: 'emojis/blobs/smile.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob stare',
    short_names: ['blob_stare'],
    keywords: ['blob', 'stare'],
    imageUrl: 'emojis/blobs/stare.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob triggered',
    short_names: ['blob_triggered'],
    keywords: ['blob', 'triggered'],
    imageUrl: 'emojis/blobs/triggered.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob ugh',
    short_names: ['blob_ugh'],
    keywords: ['blob', 'ugh'],
    imageUrl: 'emojis/blobs/ugh.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob wat',
    short_names: ['blob_wat'],
    keywords: ['blob', 'wat'],
    imageUrl: 'emojis/blobs/wat.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob wave',
    short_names: ['blob_wave'],
    keywords: ['blob', 'wave'],
    imageUrl: 'emojis/blobs/wave.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob wink',
    short_names: ['blob_wink'],
    keywords: ['blob', 'wink'],
    imageUrl: 'emojis/blobs/wink.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Blob yay',
    short_names: ['blob_yay'],
    keywords: ['blob', 'yay'],
    imageUrl: 'emojis/blobs/yay.gif',
    customCategory: 'blobs'
  },
  {
    name: 'Piggy angry',
    short_names: ['piggy_angry'],
    keywords: ['piggy', 'angry'],
    imageUrl: 'emojis/piggys/angry.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy boom',
    short_names: ['piggy_boom'],
    keywords: ['piggy', 'boom'],
    imageUrl: 'emojis/piggys/boom.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy cry',
    short_names: ['piggy_cry'],
    keywords: ['piggy', 'cry'],
    imageUrl: 'emojis/piggys/cry.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy happy',
    short_names: ['piggy_happy'],
    keywords: ['piggy', 'happy'],
    imageUrl: 'emojis/piggys/happy.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy kiss',
    short_names: ['piggy_kiss'],
    keywords: ['piggy', 'kiss'],
    imageUrl: 'emojis/piggys/kiss.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy scoot',
    short_names: ['piggy_scoot'],
    keywords: ['piggy', 'scoot'],
    imageUrl: 'emojis/piggys/scoot.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy serenade',
    short_names: ['piggy_serenade'],
    keywords: ['piggy', 'serenade'],
    imageUrl: 'emojis/piggys/serenade.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy silly',
    short_names: ['piggy_silly'],
    keywords: ['piggy', 'silly'],
    imageUrl: 'emojis/piggys/silly.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy sparkle',
    short_names: ['piggy_sparkle'],
    keywords: ['piggy', 'sparkle'],
    imageUrl: 'emojis/piggys/sparkle.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy trot',
    short_names: ['piggy_trot'],
    keywords: ['piggy', 'trot'],
    imageUrl: 'emojis/piggys/trot.gif',
    customCategory: 'piggys'
  },
  {
    name: 'Piggy wave',
    short_names: ['piggy_wave'],
    keywords: ['piggy', 'wave'],
    imageUrl: 'emojis/piggys/wave.gif',
    customCategory: 'piggys'
  }
];