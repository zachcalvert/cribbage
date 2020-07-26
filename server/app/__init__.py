#!/usr/bin/env python
import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from threading import Lock

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
thread = None
thread_lock = Lock()


@socketio.on('join')
def join(msg):
    print('received a join request')
    join_room(msg['game'])
    emit('player_join', {'name': msg['name']}, room=msg['game'])


@socketio.on('leave', namespace='/game')
def leave(message):
    leave_room(message['game'])
    emit('player_leave', {'nickname': message['nickname'], 'gameName': message['game']}, room=message['game'])


@socketio.on('chat_message')
def send_message(msg):
    emit('chat_message', {'name': msg['name'], 'message': msg['message']}, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, debug=True)
