
from app.decks.jokers import deck


class Card:

    def __init__(self, id):
        raw_card = deck.get(id)

        self.id = id
        self.name = raw_card["name"]
        self.rank = raw_card["rank"]
        self.suit = raw_card["suit"]

    def __str__(self):
        return self.name + " of " + self.suit

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rank": self.rank,
            "suit": self.suit
        }
