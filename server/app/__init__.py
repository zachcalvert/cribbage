#!/usr/bin/env python
import eventlet
eventlet.monkey_patch()

import uuid

from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from threading import Lock

from . import controller

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:3000', 'https://cribbage.live'])
thread = None
thread_lock = Lock()


@app.route('/')
def health_check():
    return {'healthy': True}


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
    room = None if msg.get('private') else msg['game']
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': msg['name'], 'message': msg['message']}, room=room)


@socketio.on('animation')
def animation(msg):
    emit('animation', {'id': str(uuid.uuid4()), 'name': msg['name'], 'imageUrl': msg['imageUrl']}, room=msg['game'])


@socketio.on('setup')
def setup(msg):
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} is setting up the game..'.format(msg['player'])}, room=msg['game'])
    emit('setup_started', {'players': [msg['player']]}, room=msg['game'])


@socketio.on('start_game')
def start_game(msg):
    game = controller.start_game(msg)
    emit('game_begun', room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': game['opening_message'], 'type': 'big'}, room=msg['game'])
    emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('draw')
def draw(msg):
    game = controller.draw(msg)
    emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])
    if game['opening_message']:
        emit('chat_message',
             {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': game['opening_message']},
             room=msg['game'])


@socketio.on('deal')
def deal(msg):
    game = controller.deal_hands(msg)
    emit('cards', {'cards': game['hands']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('joker_selected')
def joker_selection(msg):
    controller.handle_joker_selection(msg)
    message = '{} has a joker! They have made it the {} of {}'.format(msg['player'], msg['rank'], msg['suit'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'big'},
         room=msg['game'])


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

        print('sending {} points to {}'.format(game['players'][scorer], scorer))
        emit('points', {'player': scorer, 'amount': game['players'][scorer]}, room=msg['game'])
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])

    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('play')
def play_card(msg):
    valid_play, message = controller.is_valid_play(msg['game'], msg['player'], msg['card'])
    if not valid_play:
        emit('invalid_card')
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message})
        return

    game = controller.play_card(msg)
    emit('card_played', {'player': msg['player'], 'card': msg['card'], 'pegging_total': game['pegging']['total']}, room=msg['game'])
    message = '{} played {}'.format(msg['player'], game['previous_turn']['action'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message}, room=msg['game'])

    if game['previous_turn']['points'] > 0:
        scorer = game['previous_turn']['player']
        reason = game['previous_turn']['reason']
        print('sending {} points to {}'.format(game['players'][scorer], scorer))
        emit('points', {'player': scorer, 'amount': game['players'][scorer]}, room=msg['game'])

        message = '+{} for {} ({})'.format(game['previous_turn']['points'], scorer, reason)
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])

    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('pass')
def record_pass(msg):
    game = controller.record_pass(msg)
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} passed.'.format(msg['player'])}, room=msg['game'])

    if game['previous_turn']['points'] > 0:
        scorer = game['previous_turn']['player']
        reason = game['previous_turn']['reason']
        print('sending {} points to {}'.format(game['players'][scorer], scorer))
        emit('points', {'player': scorer, 'amount': game['players'][scorer]}, room=msg['game'])

        message = '+{} for {} ({})'.format(game['previous_turn']['points'], scorer, reason)
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])

    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('score')
def score_hand(msg):
    game = controller.score_hand(msg)
    message = '+{} for {} (from hand)'.format(game['previous_turn']['points'], msg['player'])
    emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])
    emit('points', {'player': msg['player'], 'amount': game['players'][msg['player']]}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('crib')
def score_crib(msg):
    game = controller.score_crib(msg)
    message = '+{} for {} (from crib)'.format(game['previous_turn']['points'], msg['player'])
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'points'}, room=msg['game'])
    print('sending {} points to {}'.format(game['players'][msg['player']], msg['player']))
    emit('points', {'player': game['dealer'], 'amount': game['players'][msg['player']]}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])
    emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])


@socketio.on('next')
def next_round(msg):
    game = controller.next_round(msg)
    if game['current_action'] == 'deal':
        message = 'New round! It is now {}\'s crib.'.format(game['dealer'])
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': 'big'}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('winner')
def winner(msg):
    game = controller.grant_victory(msg)
    emit('winner', {'player': game['winner']})
    emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': '{} wins!'.format(msg['player']), 'type': 'big'}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


@socketio.on('rematch')
def rematch(msg):
    game = controller.rematch(msg)
    if game['rematch']:
        emit('chat_message', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': game['opening_message'], 'type': 'big'}, room=msg['game'])
        emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
        emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']}, room=msg['game'])
    emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


if __name__ == '__main__':
    socketio.run(app, debug=True)
