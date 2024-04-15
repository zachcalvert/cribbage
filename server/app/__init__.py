#!/usr/bin/env python
import eventlet

eventlet.monkey_patch()

import logging
import time
import uuid

from flask import Flask
from flask_socketio import SocketIO, Namespace, emit, join_room
from threading import Lock

from app.models import Game
from app import controller
from app.models import Game
from app import utils

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = Flask(__name__)
logger = logging.getLogger(__name__)
socketio = SocketIO(
    app, cors_allowed_origins=["http://localhost:3000", "https://cribbage.live"]
)
thread = None
thread_lock = Lock()


@app.route("/all-games")
def all_games():
    games = controller.all_games()
    return {"games": games}


class CribbageNamespace(Namespace):

    def announce(self, message, room, type=None):
        emit(
            "chat",
            {
                "id": str(uuid.uuid4()),
                "name": "game-updater",
                "message": message,
                "type": type,
            },
            room=room,
        )

    def award_points(self, player, reason, amount, total, game):
        message = "+{} for {} ({})".format(amount, player, reason)
        self.announce(message, room=game, type="points")
        time.sleep(1)
        emit("points", {"player": player, "amount": total}, room=game)

    def dispatch_points(self, game):
        """give precedence to reason key"""
        if game["previous_turn"]["points"] > 0:
            t = game["previous_turn"]
            p = game["previous_turn"]["player"]
            self.award_points(
                t["player"],
                t["reason"] or t["action"],
                t["points"],
                game["players"][p],
                game["name"],
            )

    def announce_hand_score(self, game, player, card_ids, text):
        msg = "  ".join(
            [utils.card_short_text_from_id(card_id) for card_id in card_ids]
        )
        msg += f"  {text}"
        emit(
            "display_score",
            {"player": player, "text": text, "cards": card_ids},
            room=game,
        )
        self.announce(msg, room=game)
        time.sleep(1.5)

    def play_card(self, player, card, game, total=None):
        emit(
            "card_played",
            {"player": player, "card": card, "pegging_total": total},
            room=game,
        )

    def score_hand(self, game):
        emit("cards", {"cards": game["hands"], "show_to_all": True}, room=game["name"])
        player = game["previous_turn"]["player"]
        hand = "crib" if "crib" in game["previous_turn"]["action"] else "hand"
        short_hand = " ".join(
            [
                utils.card_short_text_from_id(card_id)
                for card_id in game["hands"][player] + [game["cut_card"]]
            ]
        )
        message = f'{game["previous_turn"]["player"]}\'s {hand}: {short_hand}'
        self.announce(message, room=game["name"])
        time.sleep(1)

        for score_type in [
            "fifteens",
            "fours",
            "threes",
            "pairs",
            "runs",
            "flush",
            "nobs",
        ]:
            for score, card_ids in game["breakdown"][score_type].items():
                self.announce_hand_score(game["name"], player, card_ids, score)

        if game["previous_turn"]["points"] == 0:
            self.award_points(
                player, f"from {hand}", 0, game["players"][player], game["name"]
            )

        self.dispatch_points(game)

    def bot_move(self, game):
        action = game.current_action
        player = game.bot

        emit(
            "send_turn",
            {
                "players": game.current_turn,
                "action": action,
            },
            room=game.id,
        )
        time.sleep(2)

        if action == "deal":
            game.deal_hands()
            emit("cards", {"cards": game.hands}, room=game.id)

        elif action == "cut":
            game.cut_deck()
            emit("cut_card", {"card": game.cut_card}, room=game.id)
            self.dispatch_points(game)

        elif action == "play":
            card = bot.choose_card_to_play(
                hand=game.hands[player], pegging_data=game.pegging_data
            )
            game.play_card(player=player, card_id=card)
            self.play_card(
                player=player,
                card=card,
                game=game,
                total=game.pegging_data["total"],
            )
            self.announce(
                "{} played {}".format(player, game.previous_turn["action"]),
                room=game.id,
            )
            self.dispatch_points(game)

        elif action == "pass":
            game_data = controller.record_pass(
                game_name=game_data["name"], player=player
            )
            self.announce("{} passed".format(game_data["bot"]), room=game_data["name"])
            self.dispatch_points(game_data)

        elif action == "score":
            game_data = controller.score_hand(
                game_name=game_data["name"], player=player
            )
            self.score_hand(game_data)

        elif action == "crib":
            time.sleep(1)
            game_data = controller.score_crib(game_name=game_data["name"])
            self.score_hand(game_data)

        return game_data

    def on_player_refresh(self, msg):
        join_room(msg["game"])
        game = controller.get_or_create_game(msg["game"])
        emit("players", {"players": list(game["players"].keys())})
        emit(
            "draw_board",
            {"players": game["players"], "winning_score": game["winning_score"]},
        )
        emit(
            "send_turn",
            {
                "players": game["current_turn"],
                "action": game["current_action"],
                "crib": game["dealer"],
            },
        )
        self.announce("{} refreshed".format(msg["name"]), room=msg["game"])

        emit(
            "send_cards", {"cards": game["hands"], "played_cards": game["played_cards"]}
        )

        if game["cut_card"]:
            emit("cut_card", {"card": game["cut_card"]})

        for player, points in game["players"].items():
            emit("points", {"player": player, "amount": points})

        if game["current_action"] in ["play", "pass"]:
            emit("pegging_total", {"pegging_total": game["pegging"]["total"]})

    def on_player_join(self, msg):
        room = msg["id"]
        player = msg["name"]

        join_room(room)

        game_id = room
        game = Game(id=game_id)
        game.add_player(player)

        emit("players", {"players": list(game.players.keys())}, room=room)
        self.announce("{} joined".format(msg["name"]), room=room)

    def on_player_leave(self, msg):
        game = Game(id=msg["id"])
        player = msg["name"]

        game.remove_player(player)

        emit("players", {"players": list(game.players.keys())}, room=game.id)
        self.announce("{} left".format(player), room=game.id)

    def on_chat_message(self, msg):
        room = None if msg.get("private") else msg["room"]
        emit(
            "chat",
            {"id": str(uuid.uuid4()), "name": msg["name"], "message": msg["message"]},
            room=room,
        )

    def on_animation(self, msg):
        emit(
            "animation",
            {"id": str(uuid.uuid4()), "name": msg["name"], "imageUrl": msg["imageUrl"]},
            room=msg["game"],
        )

    def on_setup(self, msg):
        emit("setup_started", {"players": [msg["player"]]}, room=msg["game"])
        self.announce(
            "{} is setting up the game..".format(msg["player"]), room=msg["game"]
        )

    def on_start_game(self, msg):
        game = Game(id=msg["id"])

        game.start(
            winning_score=msg["winning_score"],
            crib_size=msg["crib_size"],
            jokers=msg["jokers"],
        )

        emit("game_begun", room=game.id)
        emit(
            "draw_board",
            {"players": game.players, "winning_score": game.winning_score},
            room=game.id,
        )
        emit(
            "send_turn",
            {"players": game.current_turn, "action": game.current_action},
            room=game.id,
        )
        emit("players", {"players": list(game.players.keys())}, room=game.id)

        self.announce(game.opening_message, room=game.id, type="big")

    def on_draw(self, msg):
        game = Game(id=msg["id"])
        game.draw(player=msg["player"])

        emit(
            "cards",
            {"cards": game.hands, "show_to_all": True},
            room=game.id,
        )
        emit(
            "send_turn",
            {
                "players": game.current_turn,
                "action": game.current_action,
            },
            room=game.id,
        )
        self.announce(game.opening_message, room=game.id)

        if game.current_turn == game.bot:
            game_data = self.bot_move(game_data)
        emit(
            "send_turn",
            {
                "players": game.current_turn,
                "action": game.current_action,
                "crib": game.dealer,
            },
            room=game.id,
        )

    def on_deal(self, msg):
        game_data = controller.deal_hands(game_name=msg["game"])
        emit("cards", {"cards": game_data["hands"]}, room=msg["game"])
        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
                "crib": game_data["dealer"],
            },
            room=msg["game"],
        )

    def on_joker_selected(self, msg):
        if not controller.is_valid_joker_selection(
            game_name=msg["game"],
            player=msg["player"],
            rank=msg["rank"],
            suit=msg["suit"],
        ):
            emit("invalid_joker")
            return

        game_data = controller.handle_joker_selection(
            game_name=msg["game"],
            player=msg["player"],
            rank=msg["rank"],
            suit=msg["suit"],
        )
        emit("cards", {"cards": game_data["hands"]}, room=msg["game"])

        message = "{} got a joker! They have made it the {} of {}".format(
            msg["player"], msg["rank"], msg["suit"]
        )
        self.announce(message, room=msg["game"], type="big")

    def on_discard(self, msg):
        game_data = controller.discard(
            game_name=msg["game"],
            player=msg["player"],
            card=msg["card"],
            second_card=msg.get("second_card"),
        )
        emit("cards", {"cards": game_data["hands"]}, room=msg["game"])

        logger.info("345")
        while game_data["current_turn"] == game_data["bot"]:
            game_data = self.bot_move(game_data)

        logger.info("349")
        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
                "crib": game_data["dealer"],
            },
            room=msg["game"],
        )

    def on_cut(self, msg):
        game_data = controller.cut_deck(game_name=msg["game"])
        emit("cut_card", {"card": game_data["cut_card"]}, room=msg["game"])
        self.dispatch_points(game_data)

        if game_data["current_turn"] == game_data["bot"]:
            game_data = self.bot_move(game_data)

        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_play(self, msg):
        is_valid, message = controller.is_valid_play(
            msg["game"], msg["player"], msg["card"]
        )
        if not is_valid:
            emit("invalid_card")
            emit(
                "chat",
                {"id": str(uuid.uuid4()), "name": "game-updater", "message": message},
            )
            return

        game_data = controller.play_card(
            game_name=msg["game"], player=msg["player"], card_id=msg["card"]
        )
        self.play_card(
            player=msg["player"],
            card=msg["card"],
            game=msg["game"],
            total=game_data["pegging"]["total"],
        )
        self.announce(
            "{} played {}".format(msg["player"], game_data["previous_turn"]["action"]),
            room=msg["game"],
        )
        self.dispatch_points(game_data)

        while game_data["current_turn"] == game_data["bot"]:
            game_data = self.bot_move(game_data)

        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_pass(self, msg):
        game_data = controller.record_pass(game_name=msg["game"], player=msg["player"])
        self.announce(f'{msg["player"]} passed', room=msg["game"])
        self.dispatch_points(game_data)

        while game_data["current_turn"] == game_data["bot"]:
            game_data = self.bot_move(game_data)

        emit("pegging_total", {"pegging_total": game_data["pegging"]["total"]})
        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_score(self, msg):
        game_data = controller.score_hand(game_name=msg["game"], player=msg["player"])
        self.score_hand(game_data)

        while game_data["current_turn"] == game_data["bot"]:
            game_data = self.bot_move(game_data)

        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_crib(self, msg):
        game_data = controller.score_crib(game_name=msg["name"])
        self.score_hand(game_data)
        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_next(self, msg):
        game_data = controller.next_round(game_name=msg["name"])

        if game_data["current_action"] == "deal":
            self.announce(
                "-------------------------------",
                room=game_data["name"],
                type="big",
            )
            self.announce(
                "New round! It is now {}'s crib.".format(game_data["dealer"]),
                room=game_data["name"],
                type="big",
            )

        if game_data["current_turn"] == game_data["bot"]:
            game_data = self.bot_move(game_data)

        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
                "crib": game_data["dealer"],
            },
            room=msg["game"],
        )

    def on_winner(self, msg):
        game_data = controller.grant_victory(game_name=msg["game"])
        emit("winner", {"player": game_data["winner"]})
        self.announce("{} wins!".format(msg["player"]), room=msg["game"], type="big")
        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_rematch(self, msg):
        game_data = controller.rematch(game_name=msg["game"])
        if set(game_data["players"].keys()) == set(game_data["play_again"]):
            emit(
                "cards",
                {"cards": game_data["hands"], "show_to_all": True},
                room=msg["game"],
            )
            emit(
                "draw_board",
                {
                    "players": game_data["players"],
                    "winning_score": game_data["winning_score"],
                },
                room=msg["game"],
            )
            self.announce(game_data["opening_message"], room=msg["game"], type="big")

        emit(
            "send_turn",
            {
                "players": game_data["current_turn"],
                "action": game_data["current_action"],
            },
            room=msg["game"],
        )

    def on_get_game_data(self, msg):
        game_data = controller.get_or_create_game(game_name=msg["game"])
        stripped_keys = ["deck", "opening_message", "scoring_summary"]
        [game_data.pop(key) for key in stripped_keys]
        emit("show_game_data", {"game_data": game_data})

    def on_send_cards(self, msg):
        game_data = controller.get_or_create_game(game_name=msg["game"])
        emit(
            "send_cards",
            {"cards": game_data["hands"], "played_cards": game_data["played_cards"]},
            room=msg["game"],
        )


socketio.on_namespace(CribbageNamespace("/"))
