import random


def deal_hands(deck, players):
    random.shuffle(deck)

    hands = {}
    for player in players:
        hands[player] = [deck.pop() for card in range(12)]

    return hands, deck
