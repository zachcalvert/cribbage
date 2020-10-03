"""
"""
import importlib
import json
import logging
import os
import redis

redis_host = os.environ.get('REDISHOST', 'localhost')
cache = redis.StrictRedis(host=redis_host, port=6379)

logger = logging.getLogger(__name__)


def game_interaction(func):
    def wrapper(msg):
        game_data = json.loads(cache.get(msg['game']))
        new_data = func(game_data, **msg)
        cache.set(msg['game'], json.dumps(new_data))
        return new_data
    return wrapper


def get_value(game, value):
    g = json.loads(cache.get(game))
    return g[value]


def get_card_value(game, card_id, value):
    g = json.loads(cache.get(game))
    card = g['cards'][card_id]
    return card[value]


def get_or_create_game(name):
    try:
        g = json.loads(cache.get(name))
    except TypeError:
        g = {
            "name": name,
            "players": {},
            "state": "INIT",
            "type": 'cribbage'
        }
        cache.set(name, json.dumps(g))
    return g


def add_player(game, player):
    g = json.loads(cache.get(game))
    g['players'][player] = 0
    cache.set(game, json.dumps(g))
    return g


def remove_player(game, player):
    g = json.loads(cache.get(game))
    g['players'].pop(player)
    if not g['players']:
        cache.delete(game)
    else:
        cache.set(game, json.dumps(g))
    return g


@game_interaction
def start_game(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    result = module.start_game(game_data, **kwargs)
    return result


@game_interaction
def draw(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.draw(game_data, **kwargs)
    return game


@game_interaction
def deal_hands(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.deal_hands(game_data, **kwargs)
    return game


@game_interaction
def discard(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.discard(game_data, **kwargs)
    return game


@game_interaction
def cut_deck(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.cut_deck(game_data, **kwargs)
    return game


@game_interaction
def play_card(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.play_card(game_data, **kwargs)
    return game


def is_valid_play(game, player, card):
    game_data = json.loads(cache.get(game))
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    valid, message = module.is_valid_play(game_data, player, card)
    return valid, message


@game_interaction
def record_pass(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.record_pass(game_data, **kwargs)
    return game


@game_interaction
def score_hand(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.score_hand(game_data, **kwargs)
    return game


@game_interaction
def score_crib(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.score_crib(game_data, **kwargs)
    return game


@game_interaction
def next_round(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.next_round(game_data, **kwargs)
    return game


@game_interaction
def grant_victory(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.grant_victory(game_data, **kwargs)
    return game


@game_interaction
def rematch(game_data, **kwargs):
    module = importlib.import_module('app.games.{}'.format(game_data['type']))
    game = module.rematch(game_data, **kwargs)
    return game
