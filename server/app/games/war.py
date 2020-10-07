import random
from itertools import chain, combinations
import more_itertools as mit

from app.decks import jokers, standard



def card_text_from_id(card_id):
    """
    Return text representation of card
    :param card_id:
    :return:
    """
    if 'joker' in card_id:
        return 'a joker'
    else:
        card = standard.deck[card_id]
        return 'the {} of {}'.format(card['name'], card['suit'])


def start_game(game_data, **kwargs):
    deck = standard.deck

    players = list(game_data['players'].keys())

    game_data.update({
        'cards_on_tabe': [],
        'current_action': 'deal',
        'current_turn': players,
        'deck': list(deck.keys()),
        'hands': {},
        'has_played': [],
        'opening_message': 'This means war.. Whoever gets all the cards, wins!',
        'play_again': [],
        'played_cards': {},
        'post_deal_action': 'play',
        'rematch': False,
        'message': '',
        'win_pile': {}
    })
    for player in players:
        game_data['hands'][player] = []
        game_data['played_cards'][player] = []
        game_data['win_pile'][player] = []

    return game_data


def _sort_cards(cards):
    deck = standard.deck
    card_keys_and_values = [{card: deck.get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


def deal_hands(game_data, **kwargs):
    random.shuffle(game_data['deck'])

    hands = {}
    number_of_cards_to_deal = 26  # len(game_data['players'].keys()) % len(game_data['deck'])
    for player in game_data['players'].keys():
        dealt_cards = [game_data['deck'].pop() for card in range(number_of_cards_to_deal)]
        hands[player] = _sort_cards(dealt_cards)

    game_data['current_turn'] = list(game_data['players'].keys())
    game_data['current_action'] = 'play'
    game_data['hands'] = hands
    return game_data


def play_card(game_data, **kwargs):
    player = kwargs['player']
    card_id = kwargs['card']

    # record play
    game_data['cards_on_table'].append(card_id)
    game_data['hands'][player].remove(card_id)
    game_data['has_played'].append(player)

    if set(game_data['has_played']) == set(game_data['players'].keys()):
        # evaluate the win
        tie = False
        winner = None
        high_card = 0
        for player in game_data['players'].keys():
            if standard.deck.get(game_data['played_cards'][player])['rank'] > high_card:
                winner = player
            elif standard.deck.get(game_data['played_cards'][player])['rank'] == high_card:
                tie = True

        if not tie:
            game_data['win_message'] = '{} wins +{} cards'.format(winner, len(game_data['cards_on_table']))
            game_data['win_pile'][winner].extend(game_data['cards_on_table'])
            game_data['cards_on_table'] = []
    else:
        game_data['current_turn'].remove(player)

    return game_data


def is_valid_play(game_data, player, card):
    return True, ''


def grant_victory(game_data, **kwargs):
    game_data['winner'] = kwargs['player']
    game_data['current_turn'] = list(game_data['players'].keys())
    game_data['current_action'] = 'rematch'
    return game_data


def rematch(game_data, **kwargs):
    player = kwargs['player']
    game_data['play_again'].append(player)

    if set(game_data['play_again']) == set(game_data['players'].keys()):
        game_data = refresh_game_dict(game_data)
    else:
        game_data['current_turn'].remove(player)

    return game_data


def refresh_game_dict(game_data):
    players = list(game_data['players'].keys())
    deck = standard.deck

    game_data.update({
        'crib': [],
        'current_action': 'draw',
        'current_turn': players,
        'cut_card': '',
        'cutter': '',
        'dealer': '',
        'deck': list(deck.keys()),
        'first_to_score': '',
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
        'previous_turn': {
            'action': '',
            'player': '',
            'points': 0
        },
        'rematch': True,
        'scored_hands': [],
        'scoring_stats': {},
    })
    for player in players:
        game_data['players'][player] = 0
        game_data['hands'][player] = []
        game_data['played_cards'][player] = []
        game_data['scoring_stats'][player] = {
            'a_play': 0,
            'b_hand': 0,
            'c_crib': 0,
        }

    game_data['opening_message'] = 'First to {} wins! Cribs are {}. Lowest drawn card gets first crib.'.format(game_data['winning_score'], game_data['cribs'])
    return game_data
