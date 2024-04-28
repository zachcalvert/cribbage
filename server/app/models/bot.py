import random

from itertools import permutations

from app.models.card import Card
from app.models.hand import Hand


class Bot:

    def __init__(self, name="Bev"):
        self.name = name

    def to_dict(self):
        return {"name": self.name} if self else None

    def discard(self, hand):
        """
        Given six cards, return the four to keep
        """
        cut_card = Card(id="uhgfhc")
        max_points = -1
        card_ids = []

        for set_of_four in permutations(hand, 4):
            cards = [Card(id=card_id) for card_id in set_of_four]
            hand = Hand(cards, cut_card)
            hand_points = hand.calculate_points()

            if hand_points > max_points:
                max_points = hand_points
                card_ids = set_of_four

        return list(card_ids)

    def choose_card_to_play(self, hand, pegging_data):
        """
        return card_id

        'pegging': {
            'cards': [],
            'passed': [],
            'run': [],
            'total': 0
        },
        """
        from app.models import Card

        cards_in_hand = [Card(id=card_id) for card_id in hand]
        cards_in_hand.reverse()

        try:
            most_recent = Card(id=pegging_data["cards"][0])
        except IndexError:  # first card, anything but a 5 if possible
            for card in cards_in_hand:
                if card.value != 5:
                    return card.id
            return random.choice(hand)

        for card in cards_in_hand:
            if (
                card.value + pegging_data["total"] == 15
                or card.value + pegging_data["total"] == 31
            ):
                return card.id

            if card.rank == most_recent.rank and (
                pegging_data["total"] + card.value <= 31
            ):
                return card.id

        for card in cards_in_hand:
            if pegging_data["total"] + card.value <= 31:
                return card.id

        return None
