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
        game = json.loads(cache.get(msg['game']))
        new_data = func(game, msg)
        cache.set(msg['game'], json.dumps(new_data))
        print('returning {}'.format(new_data))
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


@game_interaction
def start_game(game, params):
    module = importlib.import_module('app.games.{}'.format(game['type']))
    result = module.start_game(game, params)
    return result


@game_interaction
def deal_hands(game, params):
    players = list(game['players'].keys())
    deck = list(game['cards'].keys())

    module = importlib.import_module('app.games.{}'.format(game['type']))
    hands, updated_deck = module.deal_hands(players, deck)

    game['deck'] = updated_deck
    game['hands'] = hands
    return game


@game_interaction
def discard(game, params):
    player = params['player']
    card = params['card']
    game['hands'][player]['cards'].remove(card)
    return game
