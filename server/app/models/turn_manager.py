from app.decks.jokers import deck

class TurnManager:

    @staticmethod
    def next_player(players_in_order, hands, active_players):
        return TurnManager.next_for_this_round(players_in_order, hands, active_players) or TurnManager.next_with_cards(
            players_in_order, hands
        )

    @staticmethod
    def next_for_this_round(players_in_order, hands, active_players):
        """
        Find the next player who still has cards and has not passed
        """
        for player in players_in_order:
            if player in active_players and hands[player]:
                return player
        return None

    @staticmethod
    def next_with_cards(players_in_order, hands):
        """
        Find the next player who still has cards
        """
        for player in players_in_order:
            if hands[player]:
                return player
        return None

    @staticmethod
    def play_or_pass(hand, pegging_total):
        """
        Determine if the next player has cards to play or should pass.
        """
        action = "pass"
        card_values = [deck.get(card_id)["rank"] for card_id in hand]

        remainder = 31 - pegging_total
        if any(int(value) <= remainder for value in card_values):
            action = "play"

        return action
