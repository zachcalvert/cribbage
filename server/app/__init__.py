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
from . import utils

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:3000', 'https://cribbage.live'])
thread = None
thread_lock = Lock()


@app.route('/all-games')
def all_games():
    games = controller.all_games()
    return {'games': games}


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
        time.sleep(1)
        emit('points', {'player': player, 'amount': total}, room=game)

    def dispatch_points(self, game):
        """give precedence to reason key"""
        if game['previous_turn']['points'] > 0:
            t = game['previous_turn']
            p = game['previous_turn']['player']
            self.award_points(t['player'], t['reason'] or t['action'], t['points'], game['players'][p], game['name'])

    def announce_hand_score(self, game, player, card_ids, text):
        msg = "  ".join([utils.card_short_text_from_id(card_id) for card_id in card_ids])
        msg += f'  {text}'
        emit('display_score', {'player': player, 'text': text, 'cards': card_ids}, room=game)
        # self.announce(msg, room=game)
        time.sleep(1.5)

    def play_card(self, player, card, game, total=None):
        emit('card_played', {'player': player, 'card': card, 'pegging_total': total}, room=game)

    def score_hand(self, game):
        emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=game['name'])
        player = game["previous_turn"]["player"]
        hand = 'crib' if 'crib' in game['previous_turn']['action'] else 'hand'
        short_hand = ' '.join([utils.card_short_text_from_id(card_id) for card_id in game['hands'][player] + [game['cut_card']]])
        message = f'{game["previous_turn"]["player"]}\'s {hand}: {short_hand}'
        self.announce(message, room=game['name'])
        time.sleep(1)

        for score_type in ['fifteens', 'fours', 'threes', 'pairs', 'runs', 'flush', 'nobs']:
            for score, card_ids in game['breakdown'][score_type].items():
                self.announce_hand_score(game['name'], player, card_ids, score)

        if game['previous_turn']['points'] == 0:
            self.award_points(player, f'from {hand}', 0, game['players'][player], game['name'])

        self.dispatch_points(game)

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
            self.score_hand(game)

        elif action == 'crib':
            time.sleep(1)
            game = controller.score_crib({'game': game['name'], 'player': player})
            self.score_hand(game)

        return game

    def on_player_join(self, msg):
        join_room(msg['game'])
        controller.get_or_create_game(msg['game'])
        game = controller.add_player(msg['game'], msg['name'])
        emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
        self.announce('{} joined'.format(msg['name']), room=msg['game'])

    def on_player_refresh(self, msg):
        join_room(msg['game'])
        game = controller.get_or_create_game(msg['game'])
        emit('players', {'players': list(game['players'].keys())})
        emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']})
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action'], 'crib': game['dealer']})
        self.announce('{} refreshed'.format(msg['name']), room=msg['game'])

        emit('send_cards', {'cards': game['hands'], 'played_cards': game['played_cards']})

        if game['cut_card']:
            emit('cut_card', {'card': game['cut_card']})

        for player, points in game['players'].items():
            emit('points', {'player': player, 'amount': points})

        if game['current_action'] in ['play', 'pass']:
            emit('pegging_total', {'pegging_total': game['pegging']['total']})

    def on_player_leave(self, msg):
        game = controller.remove_player(msg['game'], msg['name'])
        emit('players', {'players': list(game['players'].keys())}, room=msg['game'])
        self.announce('{} left'.format(msg['name']), room=msg['game'])

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
        is_valid = controller.is_valid_joker_selection(msg['game'], msg['player'], msg['rank'], msg['suit'])
        if not is_valid:
            emit('invalid_joker')
            return

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

        emit('pegging_total', {'pegging_total': game['pegging']['total']})
        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_score(self, msg):
        game = controller.score_hand(msg)
        self.score_hand(game)

        while game['current_turn'] == game['bot']:
            game = self.bot_move(game)

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_crib(self, msg):
        game = controller.score_crib(msg)
        self.score_hand(game)
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
        if set(game['players'].keys()) == set(game['play_again']):
            emit('cards', {'cards': game['hands'], 'show_to_all': True}, room=msg['game'])
            emit('draw_board', {'players': game['players'], 'winning_score': game['winning_score']}, room=msg['game'])
            self.announce(game['opening_message'], room=game['name'], type='big')

        emit('send_turn', {'players': game['current_turn'], 'action': game['current_action']}, room=msg['game'])

    def on_get_game_data(self, msg):
        game_data = controller.get_or_create_game(msg['game'])
        stripped_keys = ['deck', 'opening_message', 'scoring_summary']
        [game_data.pop(key) for key in stripped_keys]
        emit('show_game_data', {'game_data': game_data})

    def on_send_cards(self, msg):
        game = controller.get_or_create_game(msg['game'])
        emit('send_cards', {
            'cards': game['hands'],
            'played_cards': game['played_cards']
        }, room=msg['game'])


socketio.on_namespace(CribbageNamespace('/'))
