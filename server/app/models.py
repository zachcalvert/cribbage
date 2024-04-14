import json
import logging
import os
import redis

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
                "id": id,
                "players": {},
                "winning_score": "121",
                "crib_size": 4,
                "jokers": False,
                "winner": None
            }

        self.id = id
        self.players = game_data["players"]
        self.winning_score = game_data["winning_score"]
        self.crib_size = game_data["crib_size"]
        self.jokers = game_data["jokers"]
        self.winner = game_data["winner"]

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

    def save(self):
        logger.info(f"Saving game {self.id}")
        game_data = {
            "players": self.players,
            "winning_score": self.winning_score,
            "crib_size": self.crib_size,
            "jokers": self.jokers,
            "winner": self.winner
        }
        cache.set(self.id, json.dumps(game_data))
    
    def grant_victory(self, player):
        self.winner = player
        self.save()
    

