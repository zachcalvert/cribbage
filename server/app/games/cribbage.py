import random
from app.decks import jokers, standard




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


def rotate_reverse(current, players):
    """
    :param current:
    :param players:
    :return:
    """
    try:
        next_player = players[players.index(current) - 1]
    except IndexError:
        next_player = players[-1]
    return next_player


def start_game(game_data, **kwargs):
    winning_score = kwargs['winning_score']
    if kwargs['jokers']:
        cards = jokers.deck
    else:
        cards = standard.deck

    players = list(game_data['players'].keys())
    dealer = random.choice(players)
    cutter = rotate_reverse(dealer, players)
    first_to_score = rotate_turn(dealer, players)

    game_data.update({
        'cards': cards,
        'crib': [],
        'current_action': 'deal',
        'current_turn': [dealer],
        'cutter': cutter,
        'dealer': dealer,
        'deck': list(cards.keys()),
        'first_to_score': first_to_score,
        'hand_size': 6 if len(players) <= 2 else 5,
        'hands': {},
        'ok_with_next_round': [],
        'pegging': {
            'cards': [],
            'passed': [],
            'run': [],
            'total': 0
        },
        'play_again': [],
        'played_cards': {},
        'post_deal_action': 'discard',
        'scored_hands': [],
        'scoring_stats': {},
        'turn': dealer,
        'winning_score': int(winning_score)
    })
    for player in players:
        game_data['played_cards'][player] = []
        game_data['scoring_stats'][player] = {
            'a_play': 0,
            'b_hand': 0,
            'c_crib': 0
        }
    return game_data


def _sort_cards(g, cards):
    card_keys_and_values = [{card: g['cards'].get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


def deal_hands(game_data, **kwargs):
    random.shuffle(game_data['deck'])

    hands = {}
    for player in game_data['players'].keys():
        dealt_cards = [game_data['deck'].pop() for card in range(6)]
        hands[player] = _sort_cards(game_data, dealt_cards)
    game_data['current_turn'] = list(game_data['players'].keys())
    game_data['hands'] = hands
    game_data['current_action'] = 'discard'
    return game_data


def discard(game_data, **kwargs):
    player = kwargs['player']
    card = kwargs['card']
    game_data['hands'][player].remove(card)
    game_data['crib'].append(card)

    player_done = len(game_data['hands'][player]) == 4
    if player_done:
        game_data['current_turn'].remove(player)

    all_done = all(len(game_data['hands'][player]) == 4 for player in game_data['players'].keys())
    if all_done:
        game_data['current_action'] = 'cut'
        game_data['current_turn'] = game_data['cutter']

    return game_data

    # player_done = len(g['hands'][player]) <= 4
    # if player_done:
    #     game_data['discarded'].append(player)
    #
    #     if set(game_data['discarded']) == set(game_data['players']):
    #         all_have_discarded
    # done_discarding = True
