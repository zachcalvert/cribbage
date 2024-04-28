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
from app.models import Bot, Card
from app.models.hand import Hand
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
                "bot": None,
                "created_at": str(
                    datetime.datetime.now(datetime.timezone.utc).astimezone()
                ),
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
                "id": id,
                "jokers": False,
                "ok_with_next_round": [],
                "pegging": {"cards": [], "passed": [], "run": [], "total": 0},
                "play_again": [],
                "played_cards": {},
                "players": {},
                "last_play": {
                    "source": "",
                    "player": "",
                    "points": 0,
                },
                "scored_hands": [],
                "scoring_summary": [],
                "started": "",
                "winner": None,
                "winning_score": 121,
            }

            cache.set(id, json.dumps(game_data))

        for key, value in game_data.items():
            if key == "bot" and value:
                self.bot = Bot(name=value)
            else:
                setattr(self, key, value)

    def to_dict(self):
        game_data = {}
        for attr in dir(self):
            if attr.startswith("__") or callable(getattr(self, attr)):
                continue

            value = getattr(self, attr)
            if isinstance(getattr(self, attr), Bot):
                value = self.bot.name 
            if hasattr(value, "to_dict") and callable(getattr(value, "to_dict")):
                value = value.to_dict()

            game_data[attr] = value
        
        return game_data

    @classmethod
    def all_games(cls):
        games = []

        game_ids = [k.decode() for k in cache.keys()]
        for game_id in game_ids:
            game = cls(id=game_id)
            games.append(game.to_dict())

        return games

    def add_player(self, player):
        logger.info("Adding %s to game %s", player, self.id)

        if isinstance(player, Bot):
            logger.info('adding bot')
            player = player.name

        logger.info('adding player')
        self.players[player] = 0
        self.save()

    def remove_player(self, player):
        logger.info("Removing %s from game %s", player, self.id)
        self.players.pop(player)
        if not self.players:
            cache.delete(self.id)
        else:
            self.save()

    @debug_log
    def start(self, winning_score=121, crib_size=4, jokers=False):
        if len(self.players) == 1:
            self.bot = Bot()
            self.players[self.bot.name] = 0
        else:
            self.bot = None

        logger.info(
            "Starting game %s for %s. Winning score is %s, crib size is %s, jokers are %s",
            self.id,
            self.players,
            winning_score,
            crib_size,
            jokers,
        )

        self.current_action = "draw"
        self.current_turn = list(self.players.keys())
        self.crib_size = crib_size
        self.deck = jokers_deck if jokers else standard_deck
        self.jokers = jokers
        self.pegging_data = {
            "cards": [],
            "last_played": "",
            "passed": [],
            "run": [],
            "total": 0
        }
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

        self.hands[player] = [list(self.deck.keys()).pop()]
        self.current_turn.remove(player)

        if self.bot:
            self.hands[self.bot.name] = [list(self.deck.keys()).pop()]
            self.current_turn.remove(self.bot.name)

        # If everyone has drawn a card, determine roles for this round
        if all(len(self.hands[player]) == 1 for player in self.players.keys()):
            low_cut_rank = 15
            dealer = None

            for player, cards in self.hands.items():
                drawn_card = Card(id=cards[0])
                if drawn_card.rank < low_cut_rank:
                    low_cut_rank = drawn_card.rank
                    lowest_card = drawn_card
                    dealer = player

            self.current_action = "deal"
            self.current_turn = [dealer]
            self.dealer = dealer

            player_names = list(self.players.keys())
            self.cutter = utils.rotate_reverse(self.dealer, player_names)
            self.first_to_score = utils.rotate_turn(self.dealer, player_names)

            self.opening_message = (
                "{} of {} is the lowest cut card, {} gets first crib".format(
                    lowest_card.name, lowest_card.suit, dealer
                )
            )
            self.save()

    def _sort_cards(self, cards):
        return sorted(cards, key=lambda card_id: self.deck[card_id]["rank"])

    @debug_log
    def deal_hands(self):
        cards = list(self.deck.keys())
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
        discarded_index = next(i for i, card in enumerate(self.hands[player]) if card == card_id)
        discarded = self.hands[player].pop(discarded_index)
        self.crib.append(discarded)

        if second_card_id:
            discarded_index = next(i for i, card in enumerate(self.hands[player]) if card == second_card_id)
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
                self.crib.append(self.deck.popitem()[1])

            self.current_action = "cut"
            self.current_turn = [self.cutter]

        self.save()

    @debug_log
    def cut_deck(self):
        cut_card = self.deck.popitem()[1]

        while cut_card in ["joker1", "joker2"]:
            cut_card = self.deck.popitem()[1]
        
        self.cut_card = Card(id=cut_card["id"])
        self.current_action = "play"
        self.current_turn = [self.first_to_score]

        self.active_players = list(self.players.keys())
        self.save()

    def is_valid_play(self, player, card_id):
        if player not in self.current_turn:
            return False, "Whoops! It is currently {}'s turn to play.".format(
                self.current_turn
            )

        if self.deck[card_id]["value"] > (31 - self.pegging_data["total"]):
            return False, "Whoops! You gotta play a card with a lower value."

        return True, ""
        
    def _record_play(self, player, card: Card):
        self.last_play = {
            "card": str(card),
            "player": player,
            "points": 0,
            "source": ""
        }
        logger.info(self.last_play)
        try:
            self.hands[player].remove(card.id)
        except Exception:
            logger.info(self.hands)
            raise
        self.played_cards[player].append(card.id)
        self.pegging_data["cards"].insert(0, card.id)
        self.pegging_data["last_played"] = player
        self.pegging_data["total"] += card.value

    def _calculate_points(self, card: Card):
        points = 0
        points_source = []
        cards_on_table = [Card(id=card_id) for card_id in self.pegging_data["cards"]]
        pegging_total = self.pegging_data["total"]

        # check for 15 or 31
        if pegging_total == 15 or pegging_total == 31:
            points_source.append(str(pegging_total))
            points += 2

        # check for run
        run = None
        in_play = [card] + cards_on_table
        while len(in_play) > 2:
            ranks = [card.rank for card in in_play]
            possible_run = [n + min(ranks) for n in range(len(in_play))]
            if sorted(ranks) == possible_run:
                run = [card.id for card in in_play]
                break
            in_play.pop()

        if run:
            points += len(run)
            points_source.append(f"run of {len(run)}")

        # check for pairs, three of a kind, or four
        pair_string = None  # evaluate for pairs, threes, and fours
        ranks = [card.rank for card in cards_on_table]
        for count, rank in enumerate(ranks, 1):
            if card.rank == rank:
                points += count * 2
                pair_string = "{} {}s".format(count + 1, card.name)
            else:
                break

        points_source.append(pair_string) if pair_string else None

        return points, ", ".join(points_source) if points_source else None

    def _update_scoreboard(self, player, points_scored, source):
        self.players[player] += points_scored
        self.last_play.update({"points": points_scored, "source": source})

    @debug_log
    def update_current_turn(self):
        from app.models import TurnManager

        starting_point = self.active_players.index(self.current_turn[0])
        players_in_order = (
            self.active_players[starting_point + 1 :] + self.active_players[: starting_point + 1]
        )

        # This returns the next player, whether it is for this round to 31 or not
        next_player = TurnManager.next_player(
            players_in_order=players_in_order,
            hands=self.hands,
            active_players=self.active_players
        )
        # so then here, if the next player should actually be starting a fresh round,
        # they are told to pass again
        if next_player:
            logger.info("The next player is: %s", next_player)
            self.current_turn = [next_player]
            self.current_action = TurnManager.play_or_pass(
                self.hands[next_player],
                self.pegging_data["total"]
            )
        else:
            logger.info('all cards have been played, time to score hands')
            self.current_turn = [self.first_to_score]
            self.current_action = "score"

    @debug_log
    def record_played_card(self, player, card_id):
        card = Card(card_id)
        self._record_play(player=player, card=card)
        points_scored, source = self._calculate_points(card)

        if points_scored > 0:
            self._update_scoreboard(player, points_scored, source)
        
        self.update_current_turn()
        self.save()

    @debug_log
    def record_pass(self, player):
        self.update_current_turn()
        try:
            self.active_players.remove(player)
        except ValueError:
            pass
        self.save()

    @debug_log
    def score_hand(self, player):
        player_cards = self._sort_cards(self.played_cards[player])
        cards = [Card(id=card_id) for card_id in player_cards]
        cut_card = Card(id=self.cut_card)
        hand = Hand(cards, cut_card)
        hand_points = hand.calculate_points()

        self.players[player] += hand_points
        self.scored_hands.append(player)
        self.breakdown = hand.breakdown
        self.last_play = {
            "source": "from hand",
            "points": hand_points,
            "player": player,
        }

        if set(self.scored_hands) == set(self.players.keys()):
            self.current_action = "crib"
            self.current_turn = [self.dealer]
        else:
            self.current_turn= utils.rotate_turn(
                player, list(self.players.keys())
            )

        self.hands[player] = player_cards
        self.save()

    def score_crib(self):
        player = self.dealer
        crib_cards = [self.deck.get(card) for card in self.hands[self.dealer]]
        cut_card = self.deck.get(self.cut_card)
        crib = Hand(crib_cards, cut_card, is_crib=True)
        points_from_crib = crib.calculate_points()

        self.players[player] += points_from_crib
        self.breakdown = crib.breakdown
        self.last_play = {
            "source": "from crib",
            "points": points_from_crib,
            "player": player,
        }
        self.hands[self.dealer] = self._sort_cards(self.crib)

        self.current_action = "next"
        self.current_turn = list(self.players.keys())
        self.save()

    def next_round(self, player):
        player_names = list(self.players.keys())

        self.ok_with_next_round.append(player)
        if self.bot:
            self.ok_with_next_round.append(self.bot.name)

        all_have_nexted = set(self.ok_with_next_round) == set(player_names)
        if all_have_nexted:
            next_dealer = utils.rotate_turn(self.dealer, player_names)
            next_cutter = utils.rotate_reverse(next_dealer, player_names)
            next_to_score_first = utils.rotate_turn(next_dealer, player_names)

            self.crib = [],
            self.current_action = "deal"
            self.current_turn = [next_dealer]
            self.cutter = next_cutter
            self.dealer = next_dealer
            self.deck = list(self.deck.keys())
            self.first_to_score = next_to_score_first
            self.hands = {player: [] for player in self.players}
            self.ok_with_next_round = []
            self.played_cards = {player: [] for player in self.players}
            self.scored_hands = []
        else:
            self.players.remove(player)

        self.save()

    def grant_victory(self, player):
        self.current_action = "rematch"
        self.current_turn = list(self.players.keys())
        self.winner = player
        self.save()

    def rematch(self, player):
        self.play_again.append(player)

        if self.bot:
            self.play_again.append(self.bot.name)

        if set(self.play_again) == set(self.players.keys()):
            self.current_action = "draw"
            self.current_turn = self.players.keys()
            self.cut_card = ""
            self.hands = {player: [] for player in self.players}
            self.play_again = []
            self.played_cards = {player: [] for player in self.players},
        else:
            self.current_turn.remove(player)

        self.save()

    def save(self):
        logger.info(f"Saving game {self.id}")
        cache.set(self.id, json.dumps(self.to_dict()))
