import random

from itertools import permutations

from app.decks.standard import deck


def discard(hand):
    """
    Given six cards, return the four to keep
    """
    from app.controller import Hand

    cut_card = {
        "value": 0,
        "suit": "none",
        "rank": 0,
        "name": "none"
    }
    max_points = -1
    card_ids = []
    for set_of_four in permutations(hand, 4):
        cards = [deck.get(c) for c in set_of_four]
        hand = Hand(cards, cut_card)
        try:
            hand_points = hand.calculate_points()
        except Exception as e:
            print('Exception calculating bot points: {}'.format(e))
            print('cards are: {}'.format(cards))
            print('cut card is: {}'.format(cut_card))
            continue
        if hand_points > max_points:
            max_points = hand_points
            card_ids = set_of_four

    return card_ids


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
    cards_in_hand = [{card: deck.get(card)} for card in hand]
    cards_in_hand.reverse()
    cards_on_table = [deck.get(c) for c in pegging_data['cards']]

    try:
        most_recent = deck.get(pegging_data['cards'][0])
    except IndexError:  # first card, anything but a 5 if possible
        for card in cards_in_hand:
            card_id = list(card.keys())[0]
            card_data = list(card.values())[0]

            if card_data['value'] != 5:
                return card_id
        return random.choice(hand)

    for card in cards_in_hand:
        card_id = list(card.keys())[0]
        card_data = list(card.values())[0]

        if card_data['value'] + pegging_data['total'] == 15 or card_data['value'] + pegging_data['total'] == 31:
            return card_id

        if card_data['rank'] == most_recent['rank'] and (pegging_data['total'] + card_data['value'] <= 31):
            return card_id

    for card in cards_in_hand:
        card_id = list(card.keys())[0]
        card_data = list(card.values())[0]

        if pegging_data['total'] + card_data['value'] <= 31:
            return card_id

    return None
