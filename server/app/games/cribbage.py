import random


# def _sort_cards(g, cards):
#     card_keys_and_values = [{card: g['cards'].get(card)} for card in cards]
#     ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
#     ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
#     return ascending_card_ids


def deal_hands(players, deck):
    random.shuffle(deck)

    hands = {}
    for player in players:
        hands[player] = [deck.pop() for card in range(6)]

    return hands, deck
