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
    game = controller.add_player(msg['game'], msg['name'])

    emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} has joined'.format(msg['name'])}, room=msg['game'])


@socketio.on('player_leave')
def player_leave(msg):
    leave_room(msg['game'])

    game = controller.remove_player(msg['game'], msg['name'])

    emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
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
    message = 'First to 121 wins! It\'s {}\'s crib.'.format(game['current_turn'][0])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message}, room=msg['game'])
    emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']}, room=msg['game'])
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

    if game['previous_turn']['points'] > 0:
        scorer = game['previous_turn']['player']
        action = game['previous_turn']['action']
        message = '+{} for {} ({})'.format(game['previous_turn']['points'], scorer, action)

        emit('points', {'player': scorer, 'amount': game['players'][scorer]}, room=msg['game'])
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])

    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('play')
def play_card(msg):
    game = controller.play_card(msg)
    emit('card_played', {'player': msg['player'], 'card': msg['card'], 'pegging_total': game['pegging']['total']}, room=msg['game'])
    message = '{} played {}'.format(msg['player'], game['previous_turn']['action'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message}, room=msg['game'])

    if game['previous_turn']['points'] > 0:
        scorer = game['previous_turn']['player']
        reason = game['previous_turn']['reason']
        emit('points', {'player': scorer, 'amount': game['players'][scorer]}, room=msg['game'])

        message = '+{} for {} ({})'.format(game['previous_turn']['points'], scorer, reason)
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])

    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('pass')
def record_pass(msg):
    game = controller.record_pass(msg)
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} passed.'.format(msg['player'])}, room=msg['game'])

    if game['previous_turn']['action'] == 'go':
        scorer = game['previous_turn']['player']
        message = '+{} for {} (go)'.format(game['previous_turn']['points'], scorer)
        emit('points', {'player': scorer, 'amount': game['players'][scorer], 'reason': game['previous_turn']['action']}, room=msg['game'])
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])

    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('score')
def score_hand(msg):
    game = controller.score_hand(msg)
    message = '+{} for {} (from hand)'.format(game['previous_turn']['points'], msg['player'])
    emit('cards', {'cards': game['played_cards'], 'show_to_all': True}, room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])
    emit('points', {'player': msg['player'], 'amount': game['players'][msg['player']]}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('crib')
def score_crib(msg):
    game = controller.score_crib(msg)
    message = '+{} for {} (from crib)'.format(game['previous_turn']['points'], msg['player'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])
    emit('points', {'player': game['dealer'], 'amount': game['players'][game['dealer']]}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])
    emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])


@socketio.on('next')
def next_round(msg):
    game = controller.next_round(msg)
    if game['current_action'] == 'deal':
        message = 'New round! It is now {}\'s crib.'.format(game['dealer'])
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


if __name__ == '__main__':
    socketio.run(app, debug=True)
