#!/usr/bin/env python
import eventlet

eventlet.monkey_patch()

import logging
import time
import uuid

from flask import Flask
from flask_socketio import SocketIO, Namespace, emit, join_room, leave_room
from threading import Lock

from app.models import Card, Game

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
    games = Game.all_games()
    return {"games": games}


def for_game(func):
    def wrapper(self, msg):
        game_id = msg.get("id")
        game = Game(id=game_id)
        return func(self, game, msg)
    return wrapper


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

    def send_played_card(self, game: Game, player, card_id):
        emit(
            "card_played",
            {"player": player, "card": card_id, "pegging_total": game.pegging_data["total"]},
            room=game.id,
        )
        self.announce(
            "{} played {}".format(player, card_id),
            room=game.id,
        )
        if game.last_play["points"] > 0:
            points = game.last_play["source"]
            source = game.last_play["source"]
            message = "+{} for {} ({})".format(points, player, source)
            self.announce(message, type="points", room=game.id)
            time.sleep(1)
            emit("points", {"player": player, "amount": points}, room=game.id)

    def send_turn(self, game: Game):
        logger.info('sending %s to %s', game.current_action, game.current_turn)
        emit(
            "send_turn",
            {
                "players": game.current_turn,
                "action": game.current_action,
                "crib": game.dealer,
            },
            room=game.id,
        )

    def send_scored_hand(self, game: Game):
        emit("cards", {"cards": game.hands, "show_to_all": True}, room=game.id)
        player = game.last_play["player"]
        hand = "crib" if "crib" in game.last_play["action"] else "hand"
        short_hand = " ".join(
            [
                Card.short_text_from_id(card_id)
                for card_id in game.hands[player] + [game.cut_card]
            ]
        )
        message = f'{game.last_play["player"]}\'s {hand}: {short_hand}'
        self.announce(message, room=game.id)
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
            for score, card_ids in game.breakdown[score_type].items():
                msg = "  ".join(
                    [Card.short_text_from_id(card_id) for card_id in card_ids]
                )
                msg += f"  {score}"
                emit(
                    "display_score",
                    {"player": player, "text": score, "cards": card_ids},
                    room=game,
                )
                self.announce(msg, room=game)
                time.sleep(1.5)

        if game.last_play["points"] == 0:
            message = "+0 for {} ({})".format(player, 'from hand')
            self.announce(message, room=game, type="points")
            time.sleep(1)

    @for_game
    def on_player_join(self, game: Game, msg):
        player = msg["name"]

        join_room(game.id)
        game.add_player(player)

        emit("players", {"players": list(game.players.keys())}, room=game.id)
        self.announce("{} joined".format(player), room=game.id)

    @for_game
    def on_player_leave(self, game: Game, msg):
        player = msg["name"]

        leave_room(game.id)
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
        player = msg["player"]
        emit("setup_started", {"players": [player]}, room=msg["game"])
        self.announce(
            "{} is setting up the game..".format(player), room=msg["game"]
        )

    @for_game
    def on_start_game(self, game: Game, msg):
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
        self.send_turn(game=game)
        self.announce(game.opening_message, room=game.id, type="big")

    @for_game
    def on_draw(self, game: Game, msg):
        game.draw(player=msg["player"])
        logger.info('HANDSSSSSS')
        logger.info(game.hands)

        emit(
            "cards",
            {"cards": game.hands, "show_to_all": True},
            room=game.id,
        )
        self.send_turn(game=game)
        self.announce(game.opening_message, room=game.id)

        if game.bot.name in game.current_turn:
            time.sleep(2)
            game.deal_hands()
            emit("cards", {"cards": game.hands}, room=game.id)

        self.send_turn(game=game)

    @for_game
    def on_deal(self, game: Game, msg):
        game.deal_hands()
        emit("cards", {"cards": game.hands}, room=game.id)
        self.send_turn(game=game)

    @for_game
    def on_joker_selected(self, game: Game, msg):
        if not game.is_valid_joker_selection(
            player=msg["player"],
            rank=msg["rank"],
            suit=msg["suit"],
        ):
            emit("invalid_joker")
            return

        game.handle_joker_selection(
            player=msg["player"],
            rank=msg["rank"],
            suit=msg["suit"],
        )
        emit("cards", {"cards": game.hands}, room=game.id)

        message = "{} got a joker! They have made it the {} of {}".format(
            msg["player"], msg["rank"], msg["suit"]
        )
        self.announce(message, type="big", room=game.id)

    @for_game
    def on_discard(self, game: Game, msg: dict):
        game.discard(
            player=msg["player"],
            card_id=msg["card"],
            second_card_id=msg.get("second_card")
        )

        emit("cards", {"cards": game.hands}, room=game.id)

        logger.info('down here 1')
        logger.info(game.bot.name)
        logger.info(game.current_turn)
        if game.bot.name in game.current_turn:
            game.cut_deck()
            emit("cut_card", {"cut_card": game.cut_card.id}, room=game.id)

        if game.bot.name in game.current_turn:
            logger.info('down here 2')
            logger.info(game.bot.name)
            logger.info(game.current_turn)
            card_id = game.bot.choose_card_to_play(
                hand=game.hands[game.bot.name], pegging_data=game.pegging_data
            )
            logger.info(card_id)
            game.record_played_card(player=game.bot.name, card_id=card_id)
            logger.info("card recorded")
            self.send_played_card(game=game, player=game.bot.name, card_id=card_id)
            game.current_action = "play"
            game.save()

        logger.info('down here 3')
        self.send_turn(game=game)

    @for_game
    def on_cut(self, game: Game, msg):
        game.cut_deck()

        emit("cut_card", {"cut_card": game.cut_card.id}, room=game.id)

        if game.cut_card.name == "Jack":
            amount = 2
            message = f"+2 for {game.dealer} (cutting a jack)"
            self.announce(message, type="points", room=game.id)

            time.sleep(1)
            emit("points", {"player": game.dealer, "amount": amount}, room=game.id)

        logger.info("checking bot name")
        logger.info(game.bot.name)
        logger.info(game.current_turn)
        if game.bot.name in game.current_turn:
            card_id = game.bot.choose_card_to_play(
                hand=game.hands[game.bot.name], pegging_data=game.pegging_data
            )
            logger.info(card_id)
            game.record_played_card(player=game.bot.name, card_id=card_id)
            logger.info("card recorded")
            self.send_played_card(game=game, player=game.bot.name, card_id=card_id)
            game.current_action = "play"
            game.save()

        logger.info('down here 4')
        logger.info(game.current_turn)
        logger.info(game.current_action)
        self.send_turn(game=game)

    @for_game
    def on_play(self, game: Game, msg):
        player = msg["player"]
        card_id = msg["card"]

        is_valid_play, message = game.is_valid_play(player=player, card_id=card_id)
        if not is_valid_play:
            emit("invalid_card")
            emit(
                "chat",
                {"id": str(uuid.uuid4()), "name": "game-updater", "message": message},
            )
            return

        logger.info('down here 5')
        logger.info(game.current_turn)
        logger.info(game.current_action)
        game.record_played_card(player=player, card_id=card_id)
        self.send_played_card(game=game, player=player, card_id=card_id)
        self.send_turn(game=game)

        while game.bot.name in game.current_turn:
            logger.info('down here 6')
            logger.info(game.current_turn)
            logger.info(game.current_action)
            card_id = game.bot.choose_card_to_play(
                hand=game.hands[game.bot.name], 
                pegging_data=game.pegging_data
            )
            if card_id:
                game.record_played_card(player=game.bot.name, card_id=card_id)
                self.send_played_card(game=game, player=game.bot.name, card_id=card_id)
            else:
                logger.info('down here 7')
                logger.info(game.current_turn)
                logger.info(game.current_action)
                game.record_pass(player=game.bot.name)
            
            self.send_turn(game=game)

    @for_game
    def on_pass(self, game: Game, msg: dict):
        player = msg["player"]
        game.record_pass(player=player)
        self.announce(f'{player} passed', room=game.id)
        self.send_turn(game=game)

        while game.bot.name in game.current_turn:
            logger.info('down here 8')
            logger.info(game.current_turn)
            logger.info(game.current_action)
            card_id = game.bot.choose_card_to_play(
                hand=game.hands[game.bot.name], 
                pegging_data=game.pegging_data
            )
            if card_id:
                game.record_played_card(player=game.bot.name, card_id=card_id)
                self.send_played_card(game=game, player=game.bot.name, card_id=card_id)
            else:
                game.record_pass(player=game.bot.name)

            self.send_turn(game=game)

    @for_game
    def on_score(self, game: Game, msg):
        game.score_hand(player=msg["player"])
        self.send_scored_hand(game_data)

        while game.bot.name in game.current_turn:
            game_data = self.bot_move(game_data)

        self.send_turn(game=game)

    @for_game
    def on_crib(self, game: Game, msg):
        game.score_crib()
        self.send_scored_hand(game=game)
        self.send_turn(game=game)

    @for_game
    def on_next(self, game: Game, msg):
        game.next_round(player=msg["player"])

        if game.current_action == "deal":
            self.announce(
                "-------------------------------",
                type="big",
            )
            self.announce(
                "New round! It is now {}'s crib.".format(game_data["dealer"]),
                type="big",
                room=game.id,
            )

        if game.bot.name in game.current_turn:
            game.deal_hands()
            emit("cards", {"cards": game.hands}, room=game.id)
            self.send_turn(game=game)

    @for_game
    def on_winner(self, game: Game, msg):
        game.grant_victory(player=msg["player"])
        emit("winner", {"player": game.winner})
        self.announce("{} wins!".format(msg["player"]), type="big", room=game.id)
        self.send_turn(game=game)

    @for_game
    def on_rematch(self, game: Game, msg):
        game.rematch(player=msg["player"])
        self.send_turn(game=game)

    @for_game
    def on_get_game_data(self, game: Game, msg):
        game_data = game.to_dict()
        stripped_keys = ["deck", "opening_message", "scoring_summary"]
        [game_data.pop(key) for key in stripped_keys]
        emit("show_game_data", {"game_data": game_data})

    @for_game
    def on_send_cards(self, game: Game):
        emit(
            "send_cards",
            {"cards": game.hands, "played_cards": game.played_cards},
            room=game.id,
        )
        self.send_turn(game=game)


socketio.on_namespace(CribbageNamespace("/"))
