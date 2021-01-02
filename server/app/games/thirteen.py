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


def play_or_pass(card_values, play_on_table):
    """
    Determine if the next player has cards to play or should pass.
    """
    action = 'pass'
    if _determine_play_type(card_values) == play_on_table['type']:
        if _highest_card(card_values) > play_on_table['highest_card']:
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
        'play_on_table': {},
        'passed_list': [],
        'previous_turn': {'points': 0},  # only here for cribbage
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
    low_card = None
    low_rank = 52
    starter = None

    for player, cards in hands.items():
        for card in cards:
            if deck.get(card)['rank'] < low_rank:
                low_rank = deck.get(card)['rank']
                low_card = card
                starter = player

    return low_card, starter


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


def _determine_play_type(cards):
    MAP = {
        1: 'singles',
        2: 'pairs',
        3: 'threes',
        4: 'four'
    }

    if all([deck.get(cards[x]['value'] for x in cards)]) == deck.get(cards[0])['value']:
        return MAP[len(cards)]

    def is_run(card_ranks):
        groups = [list(group) for group in mit.consecutive_groups(card_ranks)]
        if any(len(group) == len(ranks) for group in groups):
            return True
        return False

    ranks = sorted(deck.get(card)['rank'] for card in cards)
    if is_run(ranks):
        return 'run'

    return 'invalid'


def _highest_card(cards):
    high = 3
    for card in cards:
        if deck.get(card)['rank'] > high:
            high = deck.get(card)['rank']
    return high


def is_valid_play(game_data, player, cards):

    if game_data['low_card'] and game_data['low_card'] not in cards:
        return False, 'Whoops! You must start the game by making a play with the lowest card in your hand.'

    play_type = _determine_play_type(cards)
    if play_type == 'invalid':
        return False, 'Whoops! You cant play all those cards together.'

    # compare length of current_play
    if play_type == game_data['play_on_table']['type']:
        if _highest_card(cards) < game_data['play_on_table']['highest_card']:
            return False, 'That\'s the right play type, but it doesn\'t beat what\'s already on the table.'
    else:
        return False, 'Whoops! That\'s not the right play type.'

    return True, ''


def play_card(game_data, player, cards):
    """
    cards: list of card ids []
    """
    game_data['play_on_table']['type'] = _determine_play_type(cards)
    game_data['play_on_table']['highest_card'] = _highest_card(cards)

    player_order = list(game_data['players'].keys())
    starting_point = player_order.index(game_data['current_turn'])
    players_in_order = player_order[starting_point + 1:] + player_order[:starting_point + 1]

    next = next_player(players_in_order, game_data['hands'], game_data['passed_list'])
    game_data['current_turn'] = next
    game_data['current_action'] = play_or_pass(game_data['hands'][next_player], game_data['play_on_table'])

    return game_data


def record_pass(game_data, player):
    game_data['pegging']['passed'].append(player)
    return game_data
