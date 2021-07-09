import datetime
import json
import logging
import os
import random
import redis

from itertools import combinations
import more_itertools as mit

from app import bot
from app.hand import Hand
from app import utils
from app.decks.jokers import deck as jokers_deck
from app.decks.standard import deck as standard_deck

redis_host = os.environ.get('REDISHOST', 'redis')
cache = redis.StrictRedis(host=redis_host, port=6379)

logger = logging.getLogger(__name__)

CRIB_SIZE_MAP = {
    4: 'standard',
    5: 'spicy',
    6: 'chaotic'
}

TEXT_TO_RANK_MAP = {
    'ace': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'jack': 11,
    'queen': 12,
    'king': 13,
}


def all_games():
    games = []

    game_names = [k.decode() for k in cache.keys()]
    for game_name in game_names:
        g = json.loads(cache.get(game_name))
        if g.get('started'):
            games.append({
                "name": game_name,
                "players": g["players"],
                "jokers": g.get("jokers"),
                "crib_size": g.get("crib_size"),
                "started": g.get("started"),
                "winning_score": g.get("winning_score"),
                "winner": g.get("winner"),
                'exited_players': g.get('exited_players'),
                'chats': g.get('chats')
            })

    sorted_games = sorted(games, key=lambda k: k['started'])
    sorted_games.reverse()
    return sorted_games


def get_value(game, value):
    g = json.loads(cache.get(game))
    return g[value]


def get_card_value(game, card_id, value):
    g = json.loads(cache.get(game))
    card = g['cards'][card_id]
    return card[value]


def get_or_create_game(name):
    try:
        g = json.loads(cache.get(name))
    except TypeError:
        g = {
            "name": name,
            "players": {},
            "state": "INIT",
            'exited_players': [],
            'chats': []
        }
        cache.set(name, json.dumps(g))
    return g


def add_player(game, player):
    g = json.loads(cache.get(game))
    g['players'][player] = 0
    cache.set(game, json.dumps(g))
    return g


def remove_player(game, player):
    g = json.loads(cache.get(game))
    g['exited_players'].append(player)
    g['players'].pop(player)
    if not g['players']:
        cache.delete(game)
    else:
        cache.set(game, json.dumps(g))
    return g


def game_interaction(func):
    def wrapper(msg):
        game_data = json.loads(cache.get(msg['game']))
        new_data = func(game_data, **msg)
        cache.set(msg['game'], json.dumps(new_data))
        return new_data
    return wrapper


@game_interaction
def start_game(game_data, **kwargs):
    crib_size = kwargs.get('crib_size', 4)
    jokers = kwargs.get('jokers', False)
    winning_score = kwargs.get('winning_score', 121)
    deck = jokers_deck if jokers else standard_deck

    players = list(game_data['players'].keys())
    if len(players) == 1:
        bot = 'Bev'
        players.append(bot)
        game_data['players'][bot] = 0
    else:
        bot = False

    print(f'New game! Players are {players}.')

    game_data.update({
        'bot': bot,
        'crib': [],
        'crib_size': crib_size,
        'current_action': 'draw',
        'current_turn': players,
        'cut_card': '',
        'cutter': '',
        'dealer': '',
        'deck': list(deck.keys()),
        'first_to_score': '',
        'hand_size': 6 if len(players) <= 2 else 5,
        'hands': { player: [] for player in players },
        'jokers': jokers,
        'ok_with_next_round': [],
        'pegging': {
            'cards': [],
            'passed': [],
            'run': [],
            'total': 0
        },
        'play_again': [],
        'played_cards': { player: [] for player in players },
        'previous_turn': {
            'action': '',
            'player': '',
            'points': 0,
            'reason': None
        },
        'scored_hands': [],
        'scoring_summary': [],
        'started': str(datetime.datetime.now(datetime.timezone.utc).astimezone()),
        'winning_score': int(winning_score)
    })

    game_data['opening_message'] = 'First to {} wins! {} cribs.'.format(game_data['winning_score'],
                                                                        CRIB_SIZE_MAP[game_data['crib_size']])
    if game_data['jokers']:
        game_data['opening_message'] += ' We\'re playing with jokers!'
    game_data['opening_message'] += ' Draw to see who gets first crib.'
    return game_data


@game_interaction
def add_chat(game_data, **kwargs):
    if kwargs['name'] != 'game-updater':
        chat = {
            'name': kwargs['name'],
            'message': kwargs['message']
        }
        game_data['chats'].append(chat)
    return game_data


@game_interaction
def draw(game_data, **kwargs):
    game_data['opening_message'] = ''
    player = kwargs['player']
    players = list(game_data['players'].keys())

    random.shuffle(game_data['deck'])
    game_data['hands'][player] = [game_data['deck'].pop()]

    while game_data['hands'][player][0] in ['joker1', 'joker2']:
        game_data['cut_card'] = game_data['deck'].pop()

    game_data['current_turn'].remove(player)

    if game_data['bot']:
        bot = game_data['bot']
        game_data['hands'][bot] = [game_data['deck'].pop()]
        while game_data['hands'][bot][0] in ['joker1', 'joker2']:
            game_data['hands'][bot] = [game_data['deck'].pop()]
        game_data['current_turn'].remove(bot)

    all_have_drawn = all(len(game_data['hands'][player]) == 1 for player in game_data['players'].keys())
    if all_have_drawn:
        low_cut = 15
        dealer = None
        for player in game_data['hands']:
            if standard_deck.get(game_data['hands'][player][0])['rank'] == low_cut:
                game_data['hands'][player][0] = random.choice(['75e734d054', '60575e1068', 'ae2caea4bb', '36493dcc05'])

            if standard_deck.get(game_data['hands'][player][0])['rank'] < low_cut:
                low_cut = standard_deck.get(game_data['hands'][player][0])['rank']
                dealer = player

        game_data['dealer'] = dealer
        game_data['cutter'] = utils.rotate_reverse(dealer, players)
        game_data['first_to_score'] = utils.rotate_turn(dealer, players)
        game_data['current_action'] = 'deal'
        game_data['current_turn'] = game_data['dealer']

        message = "{} is the lowest card, {} gets first crib".format(utils.card_text_from_id(game_data['hands'][game_data['dealer']][0]), dealer)
        game_data['opening_message'] = message

    return game_data


def _sort_cards(g, cards):
    deck = jokers_deck if g['jokers'] else standard_deck
    card_keys_and_values = [{card: deck.get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


@game_interaction
def deal_hands(game_data, **kwargs):
    random.shuffle(game_data['deck'])

    hands = {}
    for player in game_data['players'].keys():
        hands[player] = []
        dealt_cards = [game_data['deck'].pop() for card in range(game_data['hand_size'])]
        hands[player] = _sort_cards(game_data, dealt_cards)

    game_data['hands'] = hands
    game_data['current_action'] = 'discard'
    game_data['current_turn'] = list(game_data['players'].keys())

    return game_data


def is_valid_joker_selection(game, player, rank, suit):
    game_data = json.loads(cache.get(game))
    new_card = utils.card_object_from_text(rank, suit)
    card_id = list(new_card.keys())[0]

    if card_id in game_data['hands'][player]:
        return False

    return True


@game_interaction
def handle_joker_selection(game_data, **kwargs):
    player = kwargs['player']
    hand = game_data['hands'][player]

    if 'joker1' in hand:
        hand.remove('joker1')
    else:
        hand.remove('joker2')

    new_card = utils.card_object_from_text(kwargs['rank'], kwargs['suit'])
    card_id = list(new_card.keys())[0]
    hand.append(card_id)
    game_data['hands'][player] = _sort_cards(game_data, hand)

    return game_data


@game_interaction
def discard(game_data, **kwargs):
    player = kwargs['player']
    card = kwargs['card']
    game_data['hands'][player].remove(card)
    game_data['crib'].append(card)

    if 'second_card' in kwargs and kwargs['second_card']:
        second_card = kwargs['second_card']
        game_data['hands'][player].remove(second_card)
        game_data['crib'].append(second_card)

    player_done = len(game_data['hands'][player]) == 4
    if player_done:
        game_data['current_turn'].remove(player)

        if game_data['bot']:
            hand =  bot.discard(game_data['hands'][game_data['bot']])
            game_data['hands'][game_data['bot']] = hand
            game_data['current_turn'].remove(game_data['bot'])

    all_done = all(len(game_data['hands'][player]) == 4 for player in game_data['players'].keys())
    if all_done:
        while len(game_data['crib']) < game_data['crib_size']:
            card = game_data['deck'].pop()
            while card in ['joker1', 'joker2']:
                card = game_data['deck'].pop()
            game_data['crib'].append(card)

        game_data['current_action'] = 'cut'
        game_data['current_turn'] = game_data['cutter']

    return game_data


@game_interaction
def cut_deck(game_data, **kwargs):
    game_data['cut_card'] = game_data['deck'].pop()

    while game_data['cut_card'] in ['joker1', 'joker2']:
        game_data['cut_card'] = game_data['deck'].pop()

    if game_data['cut_card'] in ['110e6e5b19', '56594b3880', '95f92b2f0c', '1d5eb77128']:
        dealer = game_data['dealer']
        game_data['previous_turn'] = {
            'action': 'cutting a jack',
            'points': 2,
            'player': dealer,
            'reason': None
        }
        game_data['players'][dealer] += 2

    game_data['current_action'] = 'play'
    game_data['current_turn'] = game_data['first_to_score']
    return game_data


@game_interaction
def play_card(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    card_id = kwargs['card']
    card = deck.get(card_id)
    game_data['previous_turn'] = {
        'action': utils.card_text_from_id(card_id),
        'player': player,
        'points': 0,
        'reason': None
    }

    def _one_for_go(p):
        game_data['players'][p] += 1
        game_data['previous_turn']['points'] += 1
        if game_data['previous_turn']['reason'] is None:
            game_data['previous_turn']['reason'] = 'go'
        else:
            game_data['previous_turn']['reason'] += ', go'

    def _reset_pegging_dict():
        game_data['pegging'].update({
            'cards': [],
            'last_played': '',
            'passed': [],
            'run': [],
            'total': 0
        })

    def _score_play(card_played):
        points = 0
        points_source = []
        cards_on_table = [deck.get(c) for c in game_data['pegging']['cards']]

        game_data['pegging']['total'] += card_played['value']
        if game_data['pegging']['total'] == 15 or game_data['pegging']['total'] == 31:
            points_source.append(str(game_data['pegging']['total']))
            points += 2

        run = None
        in_play = [card_played] + cards_on_table
        while len(in_play) > 2:
            vals = [card['rank'] for card in in_play]
            possible_run = [n + min(vals) for n in range(len(in_play))]
            if sorted(vals) == possible_run:
                run = [card['id'] for card in in_play]
                break
            in_play.pop()

        if run:
            points += len(run)
            points_source.append(f'run of {len(run)}')

        pair_string = None   # evaluate for pairs, threes, and fours
        ranks = [c['rank'] for c in cards_on_table]
        for count, rank in enumerate(ranks, 1):
            if card_played['rank'] == rank:
                points += count * 2
                pair_string = '{} {}s'.format(count + 1, card_played['name'])
            else:
                break
        points_source.append(pair_string) if pair_string else None

        ps = ', '.join(points_source) if len(points_source) > 0 else None
        return points, ps

    points_scored, source = _score_play(card)
    game_data['players'][player] += points_scored
    game_data['previous_turn'].update({
        'player': player,
        'points': points_scored,
        'reason': source
    })

    # record play
    game_data['hands'][player].remove(card_id)
    game_data['pegging']['cards'].insert(0, card_id)
    game_data['pegging']['last_played'] = player
    game_data['played_cards'][player].append(card_id)

    # determine next
    player_order = list(game_data['players'].keys())
    starting_point = player_order.index(game_data['current_turn'])
    players_in_order = player_order[starting_point + 1:] + player_order[:starting_point + 1]

    # don't make folks pass on 31
    if game_data['pegging']['total'] == 31:
        next_to_play = utils.next_with_cards(players_in_order, game_data['hands'])
        if next_to_play:
            _reset_pegging_dict()
            game_data['current_action'] = 'play'
            game_data['current_turn'] = next_to_play
            return game_data

    next_to_play = utils.next_for_this_round(players_in_order, game_data['hands'], game_data['pegging']['passed'])
    if not next_to_play:
        if game_data['pegging']['total'] != 31:
            _one_for_go(player)
        _reset_pegging_dict()
        next_to_play = utils.next_with_cards(players_in_order, game_data['hands'])

    if next_to_play:
        card_values = [deck[card]['value'] for card in game_data['hands'][next_to_play]]
        game_data['current_action'] = utils.play_or_pass(card_values, game_data['pegging']['total'])
        game_data['current_turn'] = next_to_play
    else:
        game_data['current_action'] = 'score'
        game_data['current_turn'] = game_data['first_to_score']
        r = game_data['previous_turn']['reason']
        game_data['previous_turn']['reason'] = r.replace('go', 'last card')

    return game_data


def is_valid_play(game, player, card):
    game_data = json.loads(cache.get(game))
    deck = jokers_deck if game_data['jokers'] else standard_deck
    card_object = deck[card]

    if card_object['value'] > (31 - game_data['pegging']['total']):
        return False, 'Whoops! You gotta play a card with a lower value.'

    if player not in game_data['current_turn']:
        return False, 'Whoops! It is currently {}\'s turn to play.'.format(game_data['current_turn'])

    return True, ''


@game_interaction
def record_pass(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    game_data['pegging']['passed'].append(kwargs['player'])

    player_order = list(game_data['players'].keys())
    starting_point = player_order.index(game_data['current_turn'])
    players_in_order = player_order[starting_point + 1:] + player_order[:starting_point + 1]
    next_to_play = utils.next_for_this_round(players_in_order, game_data['hands'], game_data['pegging']['passed'])
    if next_to_play:
        game_data['previous_turn'] = {
            'action': '',
            'points': 0,
            'player': game_data['pegging']['last_played'],
            'reason': 'go'
        }
    else:
        if game_data['pegging']['total'] != 31:
            game_data['players'][kwargs['player']] += 1

        game_data['previous_turn'] = {
            'action': 'go',
            'points': 1,
            'player': game_data['pegging']['last_played'],
            'reason': 'go'
        }
        game_data['pegging'] = {
            'cards': [],
            'last_played': '',
            'passed': [],
            'run': [],
            'total': 0
        }
        next_to_play = utils.next_with_cards(players_in_order, game_data['hands'])

    if next_to_play:
        card_values = [deck[card]['value'] for card in game_data['hands'][next_to_play]]
        game_data['current_action'] = utils.play_or_pass(card_values, game_data['pegging']['total'])
        game_data['current_turn'] = next_to_play
    else:
        game_data['current_action'] = 'score'
        game_data['current_turn'] = game_data['first_to_score']

    return game_data


@game_interaction
def score_hand(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    player_cards = _sort_cards(game_data, game_data['played_cards'][player])

    cards = [deck.get(c) for c in player_cards]
    cut_card = deck.get(game_data['cut_card'])
    hand = Hand(cards, cut_card)
    hand_points = hand.calculate_points()

    game_data['players'][player] += hand_points
    game_data['scored_hands'].append(player)
    game_data['breakdown'] = hand.breakdown
    game_data['previous_turn'] = {
        'action': 'from hand',
        'points': hand_points,
        'player': player,
        'reason': None
    }

    if set(game_data['scored_hands']) == set(game_data['players'].keys()):
        game_data['current_action'] = 'crib'
        game_data['current_turn'] = game_data['dealer']
    else:
        game_data['current_turn'] = utils.rotate_turn(player, list(game_data['players'].keys()))

    game_data['hands'][player] = player_cards
    return game_data


@game_interaction
def score_crib(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    crib = [deck.get(c) for c in game_data['crib']]
    cut_card = deck.get(game_data['cut_card'])
    crib = Hand(crib, cut_card, is_crib=True)
    crib_points = crib.calculate_points()

    game_data['crib'] = _sort_cards(game_data, game_data['crib'])
    game_data['players'][player] += crib_points
    game_data['breakdown'] = crib.breakdown
    game_data['previous_turn'] = {
        'action': 'from crib',
        'points': crib_points,
        'player': player,
        'reason': None
    }
    game_data['hands'] = game_data['hands'].fromkeys(game_data['hands'], [])
    game_data['hands'][game_data['dealer']] = game_data['crib']

    game_data['current_action'] = 'next'
    game_data['current_turn'] = list(game_data['players'].keys())
    return game_data


@game_interaction
def next_round(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck
    player = kwargs['player']
    players = list(game_data['players'].keys())

    game_data['ok_with_next_round'].append(player)
    if game_data['bot']:
        game_data['ok_with_next_round'].append(game_data['bot'])

    all_have_nexted = set(game_data['ok_with_next_round']) == set(players)
    if all_have_nexted:
        next_to_deal = utils.rotate_turn(game_data['dealer'], players)
        next_cutter = utils.rotate_reverse(next_to_deal, players)
        next_to_score_first = utils.rotate_turn(next_to_deal, players)

        game_data.update({
            'cards': {},
            'crib': [],
            'current_action': 'deal',
            'current_turn': next_to_deal,
            'cutter': next_cutter,
            'dealer': next_to_deal,
            'deck': list(deck.keys()),
            'first_to_score': next_to_score_first,
            'hands': { player: [] for player in players },
            'ok_with_next_round': [],
            'played_cards': { player: [] for player in players },
            'previous_turn': {
                'action': '',
                'player': '',
                'points': 0,
                'reason': None
            },
            'scored_hands': []
        })
    else:
        game_data['current_turn'].remove(player)

    return game_data


@game_interaction
def grant_victory(game_data, **kwargs):
    game_data['current_action'] = 'rematch'
    game_data['current_turn'] = list(game_data['players'].keys())
    game_data['winner'] = kwargs['player']
    return game_data


@game_interaction
def rematch(game_data, **kwargs):
    player = kwargs['player']
    game_data['play_again'].append(player)

    if game_data['bot']:
        game_data['play_again'].append(game_data['bot'])

    if set(game_data['play_again']) == set(game_data['players'].keys()):
        game_data = refresh_game_dict(game_data)
    else:
        game_data['current_turn'].remove(player)

    return game_data


def refresh_game_dict(game_data):
    players = list(game_data['players'].keys())
    deck = jokers_deck if game_data['jokers'] else standard_deck

    game_data.update({
        'crib': [],
        'current_action': 'draw',
        'current_turn': players,
        'cut_card': '',
        'cutter': '',
        'dealer': '',
        'deck': list(deck.keys()),
        'first_to_score': '',
        'hands': { player: [] for player in players },
        'ok_with_next_round': [],
        'pegging': {
            'cards': [],
            'passed': [],
            'run': [],
            'total': 0
        },
        'play_again': [],
        'played_cards': { player: [] for player in players },
        'players': { player: 0 for player in players },
        'previous_turn': {
            'action': '',
            'player': '',
            'points': 0,
            'reason': None
        },
        'scored_hands': [],
    })

    game_data['opening_message'] = 'First to {} wins! Cribs are {}. Lowest drawn card gets first crib.'.format(
        game_data['winning_score'],
        CRIB_SIZE_MAP[game_data['crib_size']]
    )

    return game_data
