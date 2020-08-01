#!/usr/bin/env python
import eventlet
eventlet.monkey_patch()

import uuid

from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from threading import Lock

from . import controller

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
thread = None
thread_lock = Lock()


@socketio.on('player_join')
def player_join(msg):
    join_room(msg['game'])

    controller.get_or_create_game(msg['game'])
    controller.add_player(msg['game'], msg['name'])

    emit('attendance_change', {'player': msg['name'], 'type': 'join'}, room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'cribby', 'message': 'Hi {}! Welcome :)'.format(msg['name'])})


@socketio.on('player_leave')
def player_leave(msg):
    leave_room(msg['game'])
    emit('attendance_change', {'player': msg['name'], 'type': 'leave'}, room=msg['game'])


@socketio.on('chat_message')
def send_message(msg):
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': msg['name'], 'message': msg['message']}, room=msg['game'])


@socketio.on('start_game')
def start_game(msg):
    game = controller.start_game(msg)
    emit('send_turn', {'player': game['dealer'], 'action': game['state']}, room=msg['game'])


@socketio.on('deal')
def deal(msg):
    g = controller.deal_hands(msg)
    emit('deal', {'hands': g['hands']}, room=msg['game'])


@socketio.on('discard')
def discard(msg):
    controller.discard(msg)
    emit('discard', {'player': msg['player'], 'card': msg['card']}, room=msg['game'])


if __name__ == '__main__':
    socketio.run(app, debug=True)
