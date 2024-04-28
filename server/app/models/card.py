from app.constants import SUIT_MAP
from app.decks.jokers import deck


class Card:

    def __init__(self, id):
        raw_card = deck.get(id)
        if not raw_card:
            # dummy cut card to help the bot discard pre-cut
            raw_card = {
                "value": 16,
                "suit": "none",
                "rank": 0,
                "name": "none",
            }

        self.id = id
        self.name = raw_card["name"]
        self.rank = raw_card["rank"]
        self.suit = raw_card["suit"]
        self.value = raw_card["value"]

    def __str__(self):
        return self.name + " of " + self.suit

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rank": self.rank,
            "suit": self.suit,
            "value": self.value
        }
    
    @staticmethod
    def short_text_from_id(card_id):
        text = ""
        card = deck[card_id]
        if card["rank"] in [1, 11, 12, 13]:
            text += card["name"][0].upper()
        else:
            text += str(card["rank"])
        text += SUIT_MAP[card["suit"]]
        return text
