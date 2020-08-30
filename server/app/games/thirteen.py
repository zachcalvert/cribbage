import random

from app.decks.standard import deck


def rotate_turn(current, players):
    """
    :param current:
    :param players:
    :return:
    """
    try:
        next_player = players[players.index(current) + 1]
    except IndexError:
        next_player = players[0]
    return next_player


def next_player(players_in_order, hands, passed_list):
    return next_for_this_round(players_in_order, hands, passed_list) or next_with_cards(players_in_order, hands)


def next_for_this_round(players_in_order, hands, passed_list):
    """
    Find the next player who still has cards and has not passed
    """
    for player in players_in_order:
        if hands[player] and player not in passed_list:
            return player
    return None


def next_with_cards(players_in_order, hands):
    """
    Find the next player who still has cards
    """
    for player in players_in_order:
        if hands[player]:
            return player
    return None


def play_or_pass(card_values, pegging_total):
    """
    Determine if the next player has cards to play or should pass.
    """
    action = 'pass'
    remainder = 31 - pegging_total
    if any(int(value) <= remainder for value in card_values):
        action = 'play'
    return action


def start_game(game_data, **kwargs):
    players = list(game_data['players'].keys())
    dealer = random.choice(players)

    game_data.update({
        'current_action': 'deal',
        'current_turn': [dealer],
        'dealer': dealer,
        'deck': list(deck.keys()),
        'first_to_play': '',
        'hand_size': 13 if len(players) == 4 else 17,
        'hands': {},
        'ok_with_next_round': [],
        'opening_message': 'First player to get rid of all their cards wins!',
        'play_again': [],
        'play_round': {
            'last_card_played': [],
            'current_play_type': '',  # pairs, runs of 4, singles
            'passed': [],
            '': 0
        },
        'played_cards': {},
        'rematch': False,
        'scored_hands': [],
        'scoring_stats': {},
        'turn': dealer
    })
    for player in players:
        game_data['played_cards'][player] = []

    return game_data


def _sort_cards(cards):
    """
    spades, diamonds, clubs, hearts
    """
    card_keys_and_values = [{card: deck.get(card)} for card in cards]
    ascending_card_ids = []
    for suit in ['clubs', 'diamonds', 'spades', 'hearts']:
        ascending_suit_dicts = sorted((b for b in card_keys_and_values if next(iter(b.items()))[1]['suit'] == suit), key=lambda x: (x[list(x)[0]]['rank']))
        ascending_suit_ids = [list(card_dict.keys())[0] for card_dict in ascending_suit_dicts]
        ascending_card_ids.extend(ascending_suit_ids)
    return ascending_card_ids


def _lowest_card_belongs_to(hands):
    if len(hands.keys()) == 1:
        return list(hands.keys())[0]
    clubs_belongs_to = None
    three_of_spades = '04f17d1351'
    three_of_clubs = '85ba715700'
    for player in hands.keys():
        if three_of_spades in hands[player]:
            return player
        if three_of_clubs in hands[player]:
            clubs_belongs_to = player
    return clubs_belongs_to


def deal_hands(game_data, **kwargs):
    random.shuffle(game_data['deck'])

    hands = {}
    for player in game_data['players'].keys():
        dealt_cards = [game_data['deck'].pop() for card in range(game_data['hand_size'])]
        hands[player] = _sort_cards(dealt_cards)
    game_data['current_action'] = 'play'
    game_data['current_turn'] = _lowest_card_belongs_to(hands)
    game_data['hands'] = hands
    return game_data
