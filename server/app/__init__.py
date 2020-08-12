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
    opponents = controller.get_opponents(msg['game'], msg['name'])
    print('sending these opponents back: {}'.format(opponents))

    emit('attendance_change', {'player': msg['name'], 'opponents': opponents, 'type': 'join'}, room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} has joined'.format(msg['name'])}, room=msg['game'])


@socketio.on('player_leave')
def player_leave(msg):
    leave_room(msg['game'])
    emit('attendance_change', {'player': msg['name'], 'type': 'leave'}, room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} left'.format(msg['name'])}, room=msg['game'])


@socketio.on('chat_message')
def send_message(msg):
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': msg['name'], 'message': msg['message']}, room=msg['game'])


@socketio.on('animation')
def animation(msg):
    emit('animation', {'id': str(uuid.uuid4()), 'name': msg['name'], 'imageUrl': msg['imageUrl']}, room=msg['game'])


@socketio.on('start_game')
def start_game(msg):
    game = controller.start_game(msg)
    emit('draw_board', {'players': list(game['players'].keys()), 'winning_score': game['winning_score']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('deal')
def deal(msg):
    game = controller.deal_hands(msg)
    emit('cards', {'cards': game['hands']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('discard')
def discard(msg):
    game = controller.discard(msg)
    emit('cards', {'cards': game['hands']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('cut')
def cut_deck(msg):
    game = controller.cut_deck(msg)
    emit('cut_card', {'card': game['cut_card']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('play_card')
def play_card(msg):
    game = controller.play_card(msg)
    emit('played_card', {'player': msg['player'], 'card': msg['card']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('score_hand')
def score_hand(msg):
    game = controller.score_hand(msg)
    emit('points', {'player': msg['player'], 'points': game['players'][msg['player']]}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


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
