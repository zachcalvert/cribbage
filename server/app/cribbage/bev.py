"""
Beverley manages the state of the game and all the cache interactions.

Beverley Calvert was an American woman, mother, grandmother, teacher, and feminist. She taught english in the
favelas of Brazil, and taught this game to her grandchildren in California. The author of this code is one of her
grandsons.
"""

import json
import logging
import os
import random
import redis
import time

from itertools import chain, combinations
import more_itertools as mit

from .cards import CARDS
from .hand import Hand
from .utils import rotate_turn,rotate_reverse, play_or_pass, card_object_from_text

redis_host = os.environ.get('REDISHOST', 'localhost')
cache = redis.StrictRedis(host=redis_host, port=6379)

logger = logging.getLogger(__name__)


def get_game(name):
    try:
        return json.loads(cache.get(name))
    except TypeError:
        return None


def get_cutter(game):
    g = json.loads(cache.get(game))
    return g['cutter']


def get_dealer(game):
    g = json.loads(cache.get(game))
    return g['dealer']


def get_current_turn(game):
    g = json.loads(cache.get(game))
    return g['turn']


def get_pegging_total(game):
    g = json.loads(cache.get(game))
    return g['pegging']['total']


def get_crib(game):
    g = json.loads(cache.get(game))
    crib_cards = g['crib']
    return _sort_cards(g, crib_cards)


def get_card_value(game, card_id):
    g = json.loads(cache.get(game))
    card = g['cards'][card_id]
    return card['value']


def get_game_summary(game):
    """
    Add the total in
    """
    g = json.loads(cache.get(game))
    summary = g['scoring_stats']
    for player in g['players']:
        summary[player]['total'] = g['players'][player]
    return summary


def setup_game(name, player):
    g = {
        "name": name,
        "state": "INIT",
        "players": {player: 0},
        "cards": CARDS,
        "deck": [],
        "hands": {}
    }
    cache.set(name, json.dumps(g))
    return g


def add_player(game, player):
    g = json.loads(cache.get(game))

    if g["state"] != 'INIT':
        pass  # maybe return False or something

    g['players'][player] = 0
    cache.set(game, json.dumps(g))
    return g


def remove_player(game, player):
    g = json.loads(cache.get(game))
    g['players'].pop(player)
    if len(g['players']) == 0:
        cache.delete(game)
    else:
        cache.set(game, json.dumps(g))


def _sort_cards(g, cards):
    card_keys_and_values = [{card: g['cards'].get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


def deal_hands(game):
    g = json.loads(cache.get(game))

    deck = list(g['cards'].keys())
    random.shuffle(deck)

    for player in g["players"].keys():
        dealt_cards = [deck.pop() for card in range(6)]
        g['hands'][player] = _sort_cards(g, dealt_cards)

    g['state'] = 'DISCARD'
    g['deck'] = deck
    cache.set(game, json.dumps(g))
    return ['2H', 'AC', '10D', '5S', '5C', '5H']
