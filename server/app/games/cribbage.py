import random
from itertools import chain, combinations, permutations
import more_itertools as mit

from app.decks.jokers import deck as jokers_deck
from app.decks.standard import deck as standard_deck

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


def card_text_from_id(card_id):
    """
    Return text representation of card
    :param card_id:
    :return:
    """
    if 'joker' in card_id:
        return 'a joker'
    else:
        card = standard_deck[card_id]
        return 'the {} of {}'.format(card['name'], card['suit'])


def card_object_from_text(rank, suit):
    """
    Expects text in the form: 'Ace of diamonds', 'Ten of clubs', 'Queen of spades'

    :return: card_dict of the corresponding card
    """
    suits_of_that_rank = {k: v for k, v in jokers_deck.items() if v['name'] == rank}
    card_dict = {k: v for k, v in suits_of_that_rank.items() if v['suit'] == suit}
    print(card_dict)
    return card_dict


def start_game(game_data, **kwargs):
    crib_size = kwargs.get('crib_size', 4)
    jokers = kwargs.get('jokers', False)
    winning_score = kwargs.get('winning_score', 121)
    deck = jokers_deck if jokers else standard_deck

    players = list(game_data['players'].keys())
    if len(players) == 1:
        bot = random.choice(['Bryan', 'Libby', 'Bev'])
        players.append(bot)
        game_data['players'][bot] = 0
    else:
        bot = False

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
        'deck_type': 'standard',
        'first_to_score': '',
        'hand_size': 6 if len(players) <= 2 else 5,
        'hands': {},
        'jokers': jokers,
        'joker1': {},
        'joker2': {},
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
        'previous_turn': {
            'action': '',
            'player': '',
            'points': 0
        },
        'rematch': False,
        'scored_hands': [],
        'scoring_stats': {},
        'type': 'cribbage',
        'winning_score': int(winning_score)
    })
    for player in players:
        game_data['hands'][player] = []
        game_data['played_cards'][player] = []
        game_data['scoring_stats'][player] = {
            'a_play': 0,
            'b_hand': 0,
            'c_crib': 0
        }

    game_data['opening_message'] = 'First to {} wins! {} cribs.'.format(game_data['winning_score'], CRIB_SIZE_MAP[game_data['crib_size']])
    if game_data['jokers']:
        game_data['opening_message'] += ' We\'re playing with jokers!'
    game_data['opening_message'] += ' Draw to see who gets first crib.'
    return game_data


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
        # determine dealer based on the respective cut cards
        low_cut = 15
        dealer = None
        for player in game_data['hands']:
            if standard_deck.get(game_data['hands'][player][0])['rank'] == low_cut:
                game_data['hands'][player][0] = random.choice(['75e734d054', '60575e1068', 'ae2caea4bb', '36493dcc05'])

            if standard_deck.get(game_data['hands'][player][0])['rank'] < low_cut:
                low_cut = standard_deck.get(game_data['hands'][player][0])['rank']
                dealer = player

        game_data['dealer'] = dealer
        game_data['cutter'] = rotate_reverse(dealer, players)
        game_data['first_to_score'] = rotate_turn(dealer, players)
        game_data['current_action'] = 'deal'
        game_data['current_turn'] = game_data['dealer']

        message = "{} is the lowest card, {} gets first crib".format(card_text_from_id(game_data['hands'][game_data['dealer']][0]), dealer)
        game_data['opening_message'] = message

    return game_data


def _sort_cards(g, cards):
    deck = jokers_deck if g['jokers'] else standard_deck
    card_keys_and_values = [{card: deck.get(card)} for card in cards]
    ascending_card_dicts = sorted(card_keys_and_values, key=lambda x: (x[list(x)[0]]['rank']))
    ascending_card_ids = [list(card_dict.keys())[0] for card_dict in ascending_card_dicts]
    return ascending_card_ids


def deal_hands(game_data, **kwargs):
    print(game_data['hands'])
    random.shuffle(game_data['deck'])

    hands = {}
    for player in game_data['players'].keys():
        hands[player] = []
        dealt_cards = [game_data['deck'].pop() for card in range(game_data['hand_size'])]
        hands[player] = _sort_cards(game_data, dealt_cards)

    game_data['hands'] = hands
    game_data['current_action'] = 'discard'
    game_data['current_turn'] = list(game_data['players'].keys())
    print(game_data['hands'])

    return game_data


def handle_joker_selection(game_data, **kwargs):
    rank = kwargs['rank']
    suit = kwargs['suit']
    player = kwargs['player']

    hand = game_data['hands'][player]
    if 'joker1' in hand:
        hand.remove('joker1')
    else:
        hand.remove('joker2')

    new_card = card_object_from_text(rank, suit)
    card_id = list(new_card.keys())[0]
    hand.append(card_id)
    game_data['hands'][player] = _sort_cards(game_data, hand)

    return game_data


def discard(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    card = kwargs['card']
    game_data['hands'][player].remove(card)
    game_data['crib'].append(card)

    player_done = len(game_data['hands'][player]) == 4
    if player_done:
        game_data['current_turn'].remove(player)

        if game_data['bot']:
            bot = game_data['bot']
            cut_card = {
                "value": 0,
                "suit": "none",
                "rank": 0,
                "name": "none"
            }
            max_points = -1
            card_ids = []
            for set_of_four in permutations(game_data['hands'][game_data['bot']], 4):
                cards = [deck.get(c) for c in set_of_four]
                hand = Hand(cards, cut_card)
                hand_points = hand.calculate_points()
                if hand_points > max_points:
                    max_points = hand_points
                    card_ids = set_of_four

            game_data['hands'][bot] = card_ids
            game_data['current_turn'].remove(bot)

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


def cut_deck(game_data, **kwargs):
    game_data['cut_card'] = game_data['deck'].pop()
    while game_data['cut_card'] in ['joker1', 'joker2']:
        game_data['cut_card'] = game_data['deck'].pop()

    if game_data['cut_card'] in ['110e6e5b19', '56594b3880', '95f92b2f0c', '1d5eb77128']:
        game_data['previous_turn'] = {
            'action': 'cutting a jack',
            'points': 2,
            'player': game_data['dealer']
        }

    game_data['current_action'] = 'play'
    game_data['current_turn'] = game_data['first_to_score']
    return game_data


def play_card(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    card_id = kwargs['card']
    card = deck.get(card_id)
    game_data['previous_turn'] = {
        'action': card_text_from_id(card_id),
        'player': player,
        'points': 0,
        'reason': ''
    }
    print('card was was just played, {} has {} points'.format(player, game_data['players'][player]))

    def _one_for_go(player):
        game_data['players'][player] += 1
        game_data['previous_turn']['points'] += 1
        if game_data['previous_turn']['reason'] == '':
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

        game_data['pegging']['total'] += card['value']
        if game_data['pegging']['total'] == 15 or game_data['pegging']['total'] == 31:
            points_source.append(str(game_data['pegging']['total']))
            points += 2

        def _is_run(card_ranks):
            groups = [list(group) for group in mit.consecutive_groups(card_ranks)]
            if any(len(group) == len(ranks) for group in groups):
                return True
            return False

        run_length = 0
        if game_data['pegging']['run']:  # Is there already a run going? If so, try to add to it
            ranks = sorted([rank for rank in game_data['pegging']['run']] + [card_played['rank']])
            run_is_continued = _is_run(ranks)
            game_data['pegging']['run'] = ranks if run_is_continued else []
            run_length = len(game_data['pegging']['run'])
        elif len(cards_on_table) >= 2:  # or maybe this card has started a new run
            ranks = sorted([c['rank'] for c in cards_on_table[:2]] + [card_played['rank']])
            game_data['pegging']['run'] = ranks if _is_run(ranks) else []
            run_length = len(game_data['pegging']['run'])
        if run_length > 2:
            points += run_length
            points_source.append('run of {}'.format(run_length))

        # evaluate for pairs, threes, and fours
        ranks = [c['rank'] for c in cards_on_table]
        pair_string = None
        for count, rank in enumerate(ranks, 1):
            if card_played['rank'] == rank:
                points += count * 2
                pair_string = '{} {}s'.format(count+1, card_played['name'])
            else:
                break
        points_source.append(pair_string) if pair_string else None

        ps = ', '.join(points_source)
        return points, ps

    points_scored, source = _score_play(card)
    game_data['players'][player] += points_scored
    game_data['previous_turn'].update({
        'player': player,
        'points': points_scored,
        'reason': source
    })
    print('in cribbage, {} now has {} points'.format(player, game_data['players'][player]))

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
        next_to_play = next_with_cards(players_in_order, game_data['hands'])
        if next_to_play:
            _reset_pegging_dict()
            game_data['current_action'] = 'play'
            game_data['current_turn'] = next_to_play
            return game_data

    next_to_play = next_for_this_round(players_in_order, game_data['hands'], game_data['pegging']['passed'])
    if not next_to_play:
        if game_data['pegging']['total'] != 31:
            _one_for_go(player)
        _reset_pegging_dict()
        next_to_play = next_with_cards(players_in_order, game_data['hands'])

    if next_to_play:
        card_values = [deck[card]['value'] for card in game_data['hands'][next_to_play]]
        game_data['current_action'] = play_or_pass(card_values, game_data['pegging']['total'])
        game_data['current_turn'] = next_to_play
    else:
        game_data['current_action'] = 'score'
        game_data['current_turn'] = game_data['first_to_score']

    return game_data


def is_valid_play(game_data, player, card):
    deck = jokers_deck if game_data['jokers'] else standard_deck
    card_object = deck[card]

    if card_object['value'] > (31 - game_data['pegging']['total']):
        return False, 'Whoops! You gotta play a card with a lower value.'

    if player not in game_data['current_turn']:
        return False, 'Whoops! It is currently {}\'s turn to play.'.format(game_data['current_turn'])

    return True, ''


def record_pass(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    game_data['pegging']['passed'].append(kwargs['player'])

    player_order = list(game_data['players'].keys())
    starting_point = player_order.index(game_data['current_turn'])
    players_in_order = player_order[starting_point + 1:] + player_order[:starting_point + 1]
    next_to_play = next_for_this_round(players_in_order, game_data['hands'], game_data['pegging']['passed'])
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
        next_to_play = next_with_cards(players_in_order, game_data['hands'])

    if next_to_play:
        card_values = [deck[card]['value'] for card in game_data['hands'][next_to_play]]
        game_data['current_action'] = play_or_pass(card_values, game_data['pegging']['total'])
        game_data['current_turn'] = next_to_play
    else:
        game_data['current_action'] = 'score'
        game_data['current_turn'] = game_data['first_to_score']

    return game_data


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
    game_data['previous_turn'] = {
        'action': 'hand_score',
        'points': hand_points,
        'player': player
    }

    if set(game_data['scored_hands']) == set(game_data['players'].keys()):
        game_data['current_action'] = 'crib'
        game_data['current_turn'] = game_data['dealer']
    else:
        game_data['current_turn'] = rotate_turn(player, list(game_data['players'].keys()))

    game_data['hands'][player] = player_cards
    return game_data


def score_crib(game_data, **kwargs):
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    crib_card_ids = game_data['crib']
    cards = [deck.get(c) for c in crib_card_ids]
    cut_card = deck.get(game_data['cut_card'])
    crib = Hand(cards, cut_card, is_crib=True)
    crib_points = crib.calculate_points()

    game_data['crib'] = _sort_cards(game_data, game_data['crib'])
    game_data['players'][player] += crib_points
    game_data['previous_turn'] = {
        'action': 'from crib',
        'points': crib_points,
        'player': player
    }
    game_data['hands'] = game_data['hands'].fromkeys(game_data['hands'], [])
    game_data['hands'][game_data['dealer']] = game_data['crib']

    game_data['current_action'] = 'next'
    game_data['current_turn'] = list(game_data['players'].keys())
    print('after crib, {} has {} points'.format(player, game_data['players'][player]))
    return game_data


def next_round(game_data, **kwargs):
    print('in next round')
    deck = jokers_deck if game_data['jokers'] else standard_deck

    player = kwargs['player']
    game_data['ok_with_next_round'].append(player)

    if game_data['bot']:
        game_data['ok_with_next_round'].append(game_data['bot'])

    all_have_nexted = set(game_data['ok_with_next_round']) == set(list(game_data['players'].keys()))
    if all_have_nexted:
        next_to_deal = rotate_turn(game_data['dealer'], list(game_data['players'].keys()))
        next_cutter = rotate_reverse(next_to_deal, list(game_data['players'].keys()))
        next_to_score_first = rotate_turn(next_to_deal, list(game_data['players'].keys()))

        game_data.update({
            'crib': [],
            'current_action': 'deal',
            'current_turn': next_to_deal,
            'cutter': next_cutter,
            'dealer': next_to_deal,
            'deck': list(deck.keys()),
            'first_to_score': next_to_score_first,
            'hands': {},
            'ok_with_next_round': [],
            'played_cards': {},
            'previous_turn': {
                'action': '',
                'player': '',
                'points': 0
            },
            'scored_hands': []
        })
        for player in list(game_data['players'].keys()):
            game_data['played_cards'][player] = []

        print('after updating the game dict for next round, game data is: {}'.format(game_data))
    else:
        game_data['current_turn'].remove(player)

    print('after next round, {} has {} points'.format(player, game_data['players'][player]))
    return game_data


def grant_victory(game_data, **kwargs):
    game_data['winner'] = kwargs['player']
    game_data['current_turn'] = list(game_data['players'].keys())
    game_data['current_action'] = 'rematch'
    return game_data


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

    game_data['opening_message'] = 'First to {} wins! Cribs are {}. Lowest drawn card gets first crib.'.format(
        game_data['winning_score'],
        CRIB_SIZE_MAP[game_data['crib_size']]
    )

    return game_data


class Hand:
    def __init__(self, cards, cut_card, is_crib=False):
        self.cards = cards
        self.cut_card = cut_card
        self.is_crib = is_crib

        self.fifteens = {}
        self.pairs = None
        self.runs = []
        self.flush_points = 0
        self.nobs = False
        self.points = 0

    def __str__(self):
        s = ''
        for card in self.cards:
            s += (card['name'] + ' of ' + card['suit'] + ", ")
        s += "{} of {}".format(self.cut_card['name'], self.cut_card['suit'])
        return s

    def _power_hand(self, values):
        """
        Given a hand of 5 cards (or 4 or 6..) this method creates every
        possible combination of the cards of that hand.
        Useful for counting 15's.
        Returns a list of tuples of each possible card combination.
        """
        assert type(values) == list
        ch = chain.from_iterable(combinations(values, r) for r in range(len(values) + 1))
        return list(ch)

    def _sum_cards(self, cards):
        """
        This method takes a hand of any length and adds the values of each card.
        Useful for counting 15's.
        Returns an int of the sum of all the cards' values
        """
        hand_sum = 0
        for card in cards:
            hand_sum += card
        return hand_sum

    def _has_fifteens(self):
        """
        Takes a hand of 5 cards, counts all ways those cards can add up to 15.
        Returns the number of points from 15s.
        """
        counter = 2
        values = sorted([card["value"] for card in self.cards] + [self.cut_card["value"]])
        all_combos = self._power_hand(values)
        for combo in all_combos:
            if self._sum_cards(combo) == 15:
                self.fifteens[counter] = combo
                counter += 2

        return self.fifteens != {}

    def _has_pairs(self):
        ranks = [card["rank"] for card in self.cards] + [self.cut_card["rank"]]
        pairs = {rank: ranks.count(rank) for rank in ranks if ranks.count(rank) > 1}
        if pairs:
            self.pairs = pairs
            return True
        return False

    def _has_runs(self):
        ranks = sorted([card["rank"] for card in self.cards] + [self.cut_card["rank"]])
        distinct_ranks = sorted(list(set(ranks)))

        groups = [list(group) for group in mit.consecutive_groups(distinct_ranks)]
        for group in groups:
            if len(group) > 2:
                multiples = False
                for card in group:
                    if ranks.count(card) > 1:
                        multiples = True
                        for i in range(0,ranks.count(card)):
                            self.runs.append(group)
                if not multiples:
                    self.runs.append(group)
                return True
        return False

    def _has_flush(self):

        def _cut_card_matches_hand():
            return self.cut_card["suit"] == next(iter(self.cards))["suit"]

        if all(card["suit"] == next(iter(self.cards))["suit"] for card in self.cards):
            if self.is_crib:
                if _cut_card_matches_hand():
                    self.flush_points = 5
                    return True
                return False

            if _cut_card_matches_hand():
                self.flush_points = 5
            else:
                self.flush_points = 4
            return True
        return False

    def _has_nobs(self):
        jacks = [card for card in self.cards if card["name"] == 'jack']
        if jacks:
            potential_nobs = [jack["suit"] for jack in jacks]
            if self.cut_card["suit"] in potential_nobs:
                self.nobs = True
                return True
        return False

    def calculate_points(self):
        points = 0
        message = ''

        if self._has_fifteens():
            for fifteen, cards in self.fifteens.items():
                message += 'Fifteen {} ({})'.format(fifteen, cards)
                points += 2

        if self._has_pairs():
            for pair in self.pairs:
                count = self.pairs.get(pair)
                if count == 4:
                    points += 12
                    message += 'four {}s for {}'.format(pair, points)
                elif count == 3:
                    points += 6
                    message += 'three {}s for {}'.format(pair, points)
                else:
                    points += 2
                    message += 'a pair of {}s for {}'.format(pair, points)

        if self._has_runs():
            for run in self.runs:
                points += len(run)
                message += 'a run of {} for {} ({})'.format(len(run), points, run)

        if self._has_flush():
            points += self.flush_points
            message += 'four {} for {}'.format(self.cards[0]['suit'], points)

        if self._has_nobs():
            points += 1
            if points > 1:
                message += 'And nobs for {}'.format(points)
            else:
                message += 'Nobs for one'

        self.points = points
        return points
