import json
import datetime
import logging
import os
import random
import redis

from app import constants
from app.decks.jokers import deck as jokers_deck
from app.decks.standard import deck as standard_deck
from app import utils

logger = logging.getLogger(__name__)

redis_host = os.environ.get("REDISHOST", "redis")
cache = redis.StrictRedis(host=redis_host, port=6379)


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
            self.bot = "Bev"
            self.players["Bev"] = 0
        else:
            self.bot = None

        logger.info(
            "Starting game %s. Winning score is %s, crib size is %s, jokers are %s",
            self.id,
            winning_score,
            crib_size,
            jokers,
        )
        self.current_turn = self.players
        deck = jokers_deck if jokers else standard_deck
        self.deck = list(deck.keys())
        self.played_cards = {player: [] for player in self.players}
        self.winning_score = winning_score
        self.crib_size = crib_size
        self.jokers = jokers
        self.started_at = str(datetime.datetime.now(datetime.timezone.utc).astimezone())

        opening_message = "First to {} wins! {} cribs. ".format(
            winning_score, constants.CRIB_SIZE_MAP[crib_size]
        )
        if jokers:
            opening_message += "We're playing with jokers! "

        opening_message += "Draw to see who gets first crib."
        self.opening_message = opening_message
        self.save()

    def draw(self, player):
        logger.info(self.deck)
        random.shuffle(self.deck)

        self.hands[player] = [self.deck.pop()]

        while self.hands[player][0] in ["joker1", "joker2"]:
            self.hands[player][0] = self.deck.pop()

        self.current_turn.remove(player)

        if self.bot:
            self.hands[self.bot] = [self.deck.pop()]
            while self.hands[self.bot][0] in ["joker1", "joker2"]:
                self.hands[self.bot][0] = self.deck.pop()
            self.current_turn.remove(self.bot)

        if all(len(self.hands[player]) == 1 for player in self.players.keys()):
            low_cut = 15
            dealer = None
            for player_hand in self.hands:
                if standard_deck.get(self.hands[player][0])["rank"] == low_cut:
                    self.hands[player][0] = random.choice(
                        ["75e734d054", "60575e1068", "ae2caea4bb", "36493dcc05"]
                    )

                if standard_deck.get(self.hands[player][0])["rank"] < low_cut:
                    low_cut = standard_deck.get(self.hands[player][0])["rank"]
                    dealer = player

            self.dealer = dealer
            self.cutter = utils.rotate_reverse(dealer, players)
            self.first_to_score = utils.rotate_turn(dealer, players)
            self.current_action = "deal"
            self.current_turn = dealer

            self.opening_message = (
                "{} is the lowest cut card, {} gets first crib".format(
                    utils.card_text_from_id(self.hands[dealer][0]), dealer
                )
            )
            self.save()

    def save(self):
        logger.info(f"Saving game {self.id}")
        game_data = {
            attr: getattr(self, attr)
            for attr in dir(self)
            if not attr.startswith("__") and not callable(getattr(self, attr))
        }
        cache.set(self.id, json.dumps(game_data))

    def grant_victory(self, player):
        self.winner = player
        self.save()
