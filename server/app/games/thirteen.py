import random

from app.decks.thirteen import deck


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
        'hand_size': 13,
        'hands': {},
        'opening_message': 'First player to get rid of all their cards wins!',
        'play_round': {
            'last_card_played': [],
            'current_play': '',  # pairs, runs of 4, singles, etc
            'passed': []
        },
        'played_cards': [],
        'rematch': False,
    })

    return game_data


def _sort_cards(cards):
    """
    spades, diamonds, clubs, hearts
    """
    card_keys_and_values = [{card: deck.get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


def _lowest_card_belongs_to(hands):
    print(hands)
    low_card = 53
    player = None
    for player, cards in hands.items():
        lowest_in_hand = min([deck.get(card)['rank'] for card in cards])
        if lowest_in_hand < low_card:
            low_card = lowest_in_hand
            player = player
    return low_card, player


def deal_hands(game_data, **kwargs):
    random.shuffle(game_data['deck'])

    hands = {}
    for player in game_data['players'].keys():
        dealt_cards = [game_data['deck'].pop() for card in range(game_data['hand_size'])]
        hands[player] = _sort_cards(dealt_cards)

    low_card, player = _lowest_card_belongs_to(hands)
    game_data['current_action'] = 'play'
    game_data['current_turn'] = player
    game_data['hands'] = hands
    game_data['low_card'] = low_card

    return game_data


def is_valid_play(game_data, player, card):
    card_object = deck[card]

    if card_object['value'] > (31 - game_data['pegging']['total']):
        return False

    if player not in game_data['current_turn']:
        return False

    return True