import random


def deal_hands(players, deck):
    random.shuffle(deck)

    hands = {}
    for player in players:
        hands[player] = [deck.pop() for card in range(12)]

    return hands, deck
