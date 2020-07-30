#!/usr/bin/env python
import eventlet
eventlet.monkey_patch()

import uuid

from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from threading import Lock

from .cribbage import bev

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
thread = None
thread_lock = Lock()


@socketio.on('player_join')
def player_join(msg):
    print('join request from {} for room {}'.format(msg['name'], msg['game']))
    join_room(msg['game'])

    if bev.get_game(msg['game']) is None:
        bev.setup_game(msg['game'], msg['name'])
    bev.add_player(msg['game'], msg['name'])

    emit('attendance_change', {'player': msg['name'], 'type': 'join'}, room=msg['game'])


@socketio.on('player_leave')
def player_leave(msg):
    print('join request from {} for room {}'.format(msg['name'], msg['game']))
    leave_room(msg['game'])
    emit('attendance_change', {'player': msg['name'], 'type': 'leave'}, room=msg['game'])


@socketio.on('chat_message')
def send_message(msg):
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': msg['name'], 'message': msg['message']}, room=msg['game'])


if __name__ == '__main__':
    socketio.run(app, debug=True)
