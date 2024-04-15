import json
import datetime
import functools
import logging
import os
import random
import redis

from app import constants
from app.decks.jokers import deck as jokers_deck
from app.decks.standard import deck as standard_deck
from app.models import Bot
from app import utils

logger = logging.getLogger(__name__)

redis_host = os.environ.get("REDISHOST", "redis")
cache = redis.StrictRedis(host=redis_host, port=6379)


def debug_log(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"-------{func.__name__.upper()}-------")
        result = func(*args, **kwargs)
        logger.info(f"-------DONE {func.__name__.upper()}-------")
        return result

    return wrapper


class Game:
    def __init__(self, id):
        try:
            game_data = json.loads(cache.get(id))
            logger.info("Fetched %s from cache", id)
        except TypeError:
            logger.info("Creating game %s", id)
            game_data = {
                "created_at": str(
                    datetime.datetime.now(datetime.timezone.utc).astimezone()
                ),
                "bot": None,
                "crib": [],
                "crib_size": 4,
                "current_action": "draw",
                "current_turn": [],
                "cut_card": "",
                "cutter": "",
                "dealer": "",
                "deck": [],
                "first_to_score": "",
                "hand_size": 6,
                "hands": {},
                "jokers": False,
                "ok_with_next_round": [],
                "pegging": {"cards": [], "passed": [], "run": [], "total": 0},
                "play_again": [],
                "played_cards": {},
                "players": {},
                "previous_turn": {
                    "action": "",
                    "player": "",
                    "points": 0,
                    "reason": None,
                },
                "scored_hands": [],
                "scoring_summary": [],
                "started": "",
                "winner": None,
                "winning_score": 121,
            }

            cache.set(id, json.dumps(game_data))

        self.id = id
        for key, value in game_data.items():
            if key == "bot" and value:
                self.bot = Bot(name=value)
            else:
                setattr(self, key, value)

    def add_player(self, player):
        logger.info("Adding %s to game %s", player, self.id)
        self.players[player] = 0
        self.save()

    def remove_player(self, player):
        logger.info("Removing %s from game %s", player, self.id)
        self.players.pop(player)
        if not self.players:
            cache.delete(self.id)
        else:
            self.save()

    def start(self, winning_score=121, crib_size=4, jokers=False):
        if len(self.players) == 1:
            self.bot = Bot()
            self.players[self.bot.name] = 0
        else:
            self.bot = None

        logger.info(
            "Starting game %s. Winning score is %s, crib size is %s, jokers are %s",
            self.id,
            winning_score,
            crib_size,
            jokers,
        )

        self.current_action = "draw"
        self.current_turn = list(self.players.keys())
        self.crib_size = crib_size
        self.deck = jokers_deck if jokers else standard_deck
        self.jokers = jokers
        self.played_cards = {player: [] for player in self.players}
        self.started_at = str(datetime.datetime.now(datetime.timezone.utc).astimezone())
        self.winning_score = winning_score

        opening_message = "First to {} wins! {} cribs. ".format(
            winning_score, constants.CRIB_SIZE_MAP[crib_size]
        )
        if jokers:
            opening_message += "We're playing with jokers! "

        opening_message += "Draw to see who gets first crib."
        self.opening_message = opening_message
        self.save()

    @debug_log
    def draw(self, player):
        deck = list(standard_deck.keys())
        random.shuffle(deck)

        self.hands[player] = [self.deck.get(deck.pop())]
        self.current_turn.remove(player)

        if self.bot:
            self.hands[self.bot.name] = [self.deck.get(deck.pop())]
            self.current_turn.remove(self.bot.name)

        # If everyone has drawn a card, determine roles for this round
        if all(len(self.hands[player]) == 1 for player in self.players.keys()):
            low_cut = {"rank": 15}
            dealer = None

            for player, cards in self.hands.items():
                drawn_card = cards[0]
                logger.info(drawn_card)
                if drawn_card["rank"] < low_cut["rank"]:
                    low_cut = drawn_card
                    dealer = player

            self.current_action = "deal"
            self.current_turn = [dealer]
            self.dealer = dealer

            player_names = list(self.players.keys())
            self.cutter = utils.rotate_reverse(self.dealer, player_names)
            self.first_to_score = utils.rotate_turn(self.dealer, player_names)

            self.opening_message = (
                "{} of {} is the lowest cut card, {} gets first crib".format(
                    low_cut["name"], low_cut["suit"], dealer
                )
            )
            self.save()

    def _sort_cards(self, cards):
        return sorted(cards, key=lambda card: self.deck[card["id"]]["rank"])

    @debug_log
    def deal_hands(self):
        cards = list(self.deck.values())
        random.shuffle(cards)

        hands = {}
        for player in self.players.keys():
            hands[player] = []
            dealt_cards = [cards.pop() for _ in range(self.hand_size)]
            self.hands[player] = self._sort_cards(dealt_cards)

        self.current_action = "discard"
        self.current_turn = list(self.players.keys())
        self.save()

    def is_valid_joker_selection(self, player, rank, suit):
        new_card = utils.card_object_from_text(rank, suit)
        card_id = list(new_card.keys())[0]

        if card_id in self.hands[player]:
            return False

        return True
    
    @debug_log
    def handle_joker_selection(self, player, rank, suit):
        hand = self.hands[player]

        if "joker1" in hand:
            hand.remove("joker1")
        else:
            hand.remove("joker2")

        new_card = utils.card_object_from_text(rank, suit)
        hand.append(new_card)

        self.hands[player] = self._sort_cards(hand)
        self.save()

    @debug_log
    def discard(self, player, card_id, second_card_id=None):
        discarded_index = next(i for i, card in enumerate(self.hands[player]) if card["id"] == card_id)
        discarded = self.hands[player].pop(discarded_index)
        self.crib.append(discarded)

        if second_card_id:
            discarded_index = next(i for i, card in enumerate(self.hands[player]) if card["id"] == second_card_id)
            discarded = self.hands[player].pop(discarded_index)
            self.crib.append(discarded)

        if len(self.hands[player]) == 4:
            self.current_turn.remove(player)

            if self.bot:
                hand = self.bot.discard(hand=self.hands[self.bot.name])
                self.hands[self.bot.name] = hand
                self.current_turn.remove(self.bot.name)

        if all(
            len(self.hands[player]) == 4 for player in self.players.keys()
        ):
            while len(self.crib) < self.crib_size:
                logger.info(self.deck)
                self.crib.append(self.deck.popitem()[1])

            self.current_action = "cut"
            self.current_turn = self.cutter
        
        self.save()

    def save(self):
        logger.info(f"Saving game {self.id}")
        game_data = {
            attr: self.bot.name if isinstance(getattr(self, attr), Bot) else getattr(self, attr)
            for attr in dir(self)
            if not attr.startswith("__") and not callable(getattr(self, attr))
        }
        cache.set(self.id, json.dumps(game_data))

    def grant_victory(self, player):
        self.winner = player
        self.save()
