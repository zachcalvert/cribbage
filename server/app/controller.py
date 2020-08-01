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


def setup_game(name):
    g = {
        "name": name,
        "players": {},
        "state": "INIT",
        "type": 'pinochle',
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


def deal_hands(game):
    g = json.loads(cache.get(game))
    deck = list(g['cards'].keys())

    module = importlib.import_module('app.games.{}'.format(g['type']))
    hands, new_deck = module.deal_hands(deck, g['players'].keys())

    g['deck'] = new_deck
    g['hands'] = hands
    cache.set(game, json.dumps(g))
    return g['hands']


def discard(game, player, card):
    g = json.loads(cache.get(game))
    g['hands'][player]['cards'].remove(card)
    cache.set(game, json.dumps(g))
    return g['hands']