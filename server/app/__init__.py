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
    print('letting {} know that it is their turn to {}'.format(game['current_turn'], game['current_action']))
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('deal')
def deal(msg):
    game = controller.deal_hands(msg)
    emit('cards', {'cards': game['hands']}, room=msg['game'])
    print('letting {} know that it is their turn to {}'.format(game['current_turn'], game['current_action']))
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('discard')
def discard(msg):
    game = controller.discard(msg)
    emit('cards', {'cards': game['hands']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('cut')
def cut(msg):
    game = controller.cut_deck(msg)
    emit(game['state'], {'cut_card': game['cut_card'], 'player': game['current_player']}, room=msg['game'])


@socketio.on('play_card')
def play_card(msg):
    game = controller.play_card(msg)
    emit('played_card', {'player': msg['player'], 'card': msg['card']}, room=msg['game'])
    emit(game['state'], {'cut_card': game['cut_card'], 'player': game['current_player']}, room=msg['game'])


@socketio.on('score')
def score(msg):
    points = controller.score_hand(msg)
    emit('scored_hand', {'player': msg['player'], 'points': points}, room=msg['game'])


@socketio.on('crib')
def crib(msg):
    points = controller.crib(msg)
    emit('scored_crib', {'player': msg['player'], 'points': points}, room=msg['game'])


@socketio.on('next')
def next_round(msg):
    game = controller.next_round(msg)
    emit(game['state'], {'player': game['current_player']}, room=msg['game'])

if __name__ == '__main__':
    socketio.run(app, debug=True)
