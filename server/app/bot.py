import random

from app.decks.standard import deck


def ok():
    pass


def draw_card():
    pass


def deal():
    pass


def cut_deck():
    pass


def play_card(hand, pegging_data):
    """
    return card_id

    'pegging': {
        'cards': [],
        'passed': [],
        'run': [],
        'total': 0
    },
    """
    try:
        most_recent = deck.get(pegging_data['cards'][0])
    except IndexError:
        return random.choice(hand)

    cards_in_hand = [{card: deck.get(card)} for card in hand]
    cards_on_table = [deck.get(c) for c in pegging_data['cards']]

    for card in cards_in_hand:
        card_id = list(card.keys())[0]
        card_data = list(card.values())[0]

        if card_data['rank'] == most_recent['rank'] and (pegging_data['total'] + card_data['value'] <= 31):
            return card_id

    for card in cards_in_hand:
        card_id = list(card.keys())[0]
        card_data = list(card.values())[0]

        if pegging_data['total'] + card_data['value'] <= 31:
            return card_id

    return None

def score_hand():
    pass


def score_crib():
    pass


def next_round():
    pass
