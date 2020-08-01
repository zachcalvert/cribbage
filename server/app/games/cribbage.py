import random
from app.decks import jokers
from app.decks import standard

# def _sort_cards(g, cards):
#     card_keys_and_values = [{card: g['cards'].get(card)} for card in cards]
#     ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
#     ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
#     return ascending_card_ids


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


def start_game(game, params):
    winning_score = params['winning_score']
    if params['jokers']:
        cards = jokers.deck
    else:
        cards = standard.deck

    players = list(game['players'].keys())
    dealer = random.choice(players)
    cutter = rotate_reverse(dealer, players)
    first_to_score = rotate_turn(dealer, players)

    game.update({
        'cards': cards,
        'crib': [],
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
        'scored_hands': [],
        'scoring_stats': {},
        'state': 'DEAL',
        'turn': dealer,
        'winning_score': int(winning_score)
    })
    for player in players:
        game['played_cards'][player] = []
        game['scoring_stats'][player] = {
            'a_play': 0,
            'b_hand': 0,
            'c_crib': 0
        }
    return game


def deal_hands(players, deck):
    random.shuffle(deck)

    hands = {}
    for player in players:
        hands[player] = [deck.pop() for card in range(6)]

    return hands, deck
