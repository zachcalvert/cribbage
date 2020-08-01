"""
Beverley manages the state of the game and all the cache interactions.

Beverley Calvert was an American woman, mother, grandmother, teacher, and feminist. She taught english in the
favelas of Brazil, and taught this game to her grandchildren in California. The author of this code is one of her
grandsons.
"""

import json
import logging
import random

from itertools import chain, combinations
import more_itertools as mit

from .cards import CARDS
from .hand import Hand
from .utils import rotate_turn,rotate_reverse, play_or_pass, card_object_from_text

logger = logging.getLogger(__name__)


def _sort_cards(g, cards):
    card_keys_and_values = [{card: g['cards'].get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


def deal_hands(deck, players):

    random.shuffle(deck)

    hands = {}
    for player in players:
        dealt_cards = [deck.pop() for card in range(6)]
        g['hands'][player] = _sort_cards(g, dealt_cards)

    g['state'] = 'DISCARD'
    g['deck'] = deck
    cache.set(game, json.dumps(g))
    return g['hands']
