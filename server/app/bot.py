import random

from app.decks.standard import deck


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
