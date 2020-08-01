"""
"""
import importlib
import json
import logging
import os
import redis

from .cribbage.cards import CARDS


redis_host = os.environ.get('REDISHOST', 'localhost')
cache = redis.StrictRedis(host=redis_host, port=6379)

logger = logging.getLogger(__name__)


def game_data_and_module(func):
    def wrapper(name):
        game = json.loads(cache.get(name))
        module = importlib.import_module('app.games.{}'.format(game['type']))
        value = func(game, module)
        return value

    return wrapper


def redis_wrapped(func):
    def wrapper(name):
        game = json.loads(cache.get(name))
        module = importlib.import_module('app.games.{}'.format(game['type']))
        print('module is {}'.format(module))
        new_data = func(game, module)
        print('new_data is {}'.format(new_data))
        cache.set(name, json.dumps(new_data))
        return new_data
    return wrapper



def get_game(name):
    try:
        return json.loads(cache.get(name))
    except TypeError:
        return None


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
            "type": 'cribbage',
            'cards': CARDS
        }
        cache.set(name, json.dumps(g))
    return g


def add_player(game, player):
    try:
        g = json.loads(cache.get(game))
        if g['state'] != 'INIT':
            return
    except TypeError:
        g = {
            "name": game,
            "players": {},
            "state": "INIT",
        }

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


@game_data_and_module
def deal_hands(game, module):
    players = list(game['players'].keys())
    deck = list(game['cards'].keys())
    hands, updated_deck = module.deal_hands(players, deck)

    game['deck'] = updated_deck
    game['hands'] = hands
    cache.set(game['name'], json.dumps(game))
    return hands


def discard(game, player, card):
    g = json.loads(cache.get(game))
    g['hands'][player]['cards'].remove(card)
    cache.set(game, json.dumps(g))
    return g['hands']