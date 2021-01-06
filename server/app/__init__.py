#!/usr/bin/env python
import eventlet
eventlet.monkey_patch()

import time
import uuid

from flask import Flask
from flask_socketio import SocketIO, Namespace, emit, join_room, leave_room
from threading import Lock

from . import controller
from . import bot

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:3000', 'https://cribbage.live'])
thread = None
thread_lock = Lock()


class CribbageNamespace(Namespace):

    def on_connect(self):
        pass

    def on_disconnect(self):
        pass

    def announce(self, message, room, type=None):
        emit('chat', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': type}, room=room)

    def award_points(self, player, reason, amount, total, game):
        message = '+{} for {} ({})'.format(amount, player, reason)
        self.announce(message, room=game, type='points')
        emit('points', {'player': player, 'amount': total}, room=game)

    def dispatch_points(self, game):
        """give precedence to reason key"""
        if game['previous_turn']['points'] > 0:
            t = game['previous_turn']
            p = game['previous_turn']['player']
            self.award_points(t['player'], t['reason'] or t['action'], t['points'], game['players'][p], game['name'])

    def play_card(self, player, card, game, total=None):
        emit('card_played', {'player': player, 'card': card, 'pegging_total': total}, room=game)

    def bot_move(self, game):
        action = game['current_action']
        player = game['bot']
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=game['name'])
        time.sleep(2)

        if action == 'deal':
            game = controller.deal_hands({'game': game['name'], 'player': player})
            emit('cards', {'cards': game['hands']}, room=game['name'])

        elif action == 'cut':
            game = controller.cut_deck({'game': game['name'], 'player': player})
            emit('cut_card', {'card': game['cut_card']}, room=game['name'])
            self.dispatch_points(game)

        elif action == 'play':
            card = bot.play_card(game['hands'][player], game['pegging'])
            game = controller.play_card({'game': game['name'], 'player': player, 'card': card})
            self.play_card(game['bot'], card, game['name'], game['pegging']['total'])
            self.announce('{} played {}'.format(game['bot'], game['previous_turn']['action']), room=game['name'])
            self.dispatch_points(game)

        elif action == 'pass':
            game = controller.record_pass({'game': game['name'], 'player': player})
            self.announce('{} passed'.format(game['bot']), room=game['name'])
            self.dispatch_points(game)

        elif action == 'score':
            game = controller.score_hand({'game': game['name'], 'player': player})
            emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=game['name'])
            self.dispatch_points(game)

        elif action == 'crib':
            time.sleep(2)
            game = controller.score_crib({'game': game['name'], 'player': player})
            emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=game['name'])
            self.dispatch_points(game)

        return game

    def on_player_join(self, msg):
        join_room(msg['game'])
        controller.get_or_create_game(msg['game'])
        game = controller.add_player(msg['game'], msg['name'])
        emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
        self.announce('{} has joined'.format(msg['name']), room=msg['game'])

    def on_player_leave(self, msg):
        leave_room(msg['game'])
        game = controller.remove_player(msg['game'], msg['name'])
        emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
        self.announce('{} has left'.format(msg['name']), room=msg['game'])

    def on_chat_message(self, msg):
        room = None if msg.get('private') else msg['game']
        emit('chat', {'id': str(uuid.uuid4()), 'name': msg['name'], 'message': msg['message']}, room=room)

    def on_animation(self, msg):
        emit('animation', {'id': str(uuid.uuid4()), 'name': msg['name'], 'imageUrl': msg['imageUrl']}, room=msg['game'])

    def on_setup(self, msg):
        emit('setup_started', {'players': [msg['player']]}, room=msg['game'])
        self.announce('{} is setting up the game..'.format(msg['player']), room=msg['game'])

    def on_start_game(self, msg):
        game = controller.start_game(msg)
        emit('game_begun', room=msg['game'])
        emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']}, room=msg['game'])
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])
        emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
        self.announce(game['opening_message'], room=msg['game'], type='big')

    def on_draw(self, msg):
        game = controller.draw(msg)
        emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])
        self.announce(game['opening_message'], room=msg['game'])
        if game['current_turn'] == game['bot']:
            game = self.bot_move(game)
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action'], 'crib': game['dealer']},
             room=msg['game'])

    def on_deal(self, msg):
        game = controller.deal_hands(msg)
        emit('cards', {'cards': game['hands']}, room=msg['game'])
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action'], 'crib': game['dealer']},
             room=msg['game'])

    def on_joker_selected(self, msg):
        game = controller.handle_joker_selection(msg)
        emit('cards', {'cards': game['hands']}, room=msg['game'])
        message = '{} got a joker! They have made it the {} of {}'.format(msg['player'], msg['rank'], msg['suit'])
        self.announce(message, room=msg['game'], type='big')

    def on_discard(self, msg):
        game = controller.discard(msg)
        emit('cards', {'cards': game['hands']}, room=msg['game'])

        while game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action'], 'crib': game['dealer']}, room=msg['game'])

    def on_cut(self, msg):
        game = controller.cut_deck(msg)
        emit('cut_card', {'card': game['cut_card']}, room=msg['game'])
        self.dispatch_points(game)

        if game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_play(self, msg):
        valid_play, message = controller.is_valid_play(msg['game'], msg['player'], msg['card'])
        if not valid_play:
            emit('invalid_card')
            emit('chat', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message})
            return

        game = controller.play_card(msg)
        self.play_card(msg['player'], msg['card'], msg['game'], game['pegging']['total'])
        self.announce('{} played {}'.format(msg['player'], game['previous_turn']['action']), room=game['name'])
        self.dispatch_points(game)

        while game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_pass(self, msg):
        game = controller.record_pass(msg)
        self.announce(f'{msg["player"]} passed', room=msg["game"])
        self.dispatch_points(game)

        while game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_score(self, msg):
        game = controller.score_hand(msg)
        emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=game['name'])
        self.dispatch_points(game)

        while game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_crib(self, msg):
        game = controller.score_crib(msg)
        emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
        self.dispatch_points(game)
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_next(self, msg):
        game = controller.next_round(msg)

        if game['current_action'] == 'deal':
            self.announce('New round! It is now {}\'s crib.'.format(game['dealer']), room=game['name'], type='big')

        if game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action'],
                           'crib': game['dealer']}, room=game['name'])

    def on_winner(self, msg):
        game = controller.grant_victory(msg)
        emit('winner', {'player': game['winner']})
        self.announce('{} wins!'.format(msg['player']), room=None, type='big')
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_rematch(self, msg):
        game = controller.rematch(msg)
        if game['rematch']:
            emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
            emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']}, room=msg['game'])
            self.announce(game['opening_message'], room=game['name'], type='big')

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])


socketio.on_namespace(CribbageNamespace('/'))
