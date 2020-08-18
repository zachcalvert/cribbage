import random
import more_itertools as mit

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
        'cut_card': '',
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
        'previous_turn': {},
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


def cut_deck(game_data, **kwargs):
    game_data['cut_card'] = game_data['deck'].pop()
    game_data['current_action'] = 'play'
    game_data['current_turn'] = game_data['first_to_score']
    return game_data


def play_card(game_data, **kwargs):
    print(game_data)
    player = kwargs['player']
    card_id = kwargs['card']
    card = game_data['cards'].get(card_id)

    # record play
    game_data['hands'][player].remove(card_id)
    game_data['pegging']['cards'].insert(0, card_id)
    game_data['pegging']['last_played'] = player
    game_data['pegging']['total'] += card['value']
    game_data['played_cards'][player].append(card_id)

    # score play
    def _score_play(card_played):
        points = 0
        cards_on_table = [game_data['cards'].get(c) for c in game_data['pegging']['cards']]

        if game_data['pegging']['total'] == 15 or game_data['pegging']['total'] == 31:
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

        ranks = [c['rank'] for c in cards_on_table]  # evaluate for pairs, threes, and fours
        for count, rank in enumerate(ranks, 0):
            if card_played['rank'] == rank:
                points += count * 2
            else:
                break
        return points

    points_scored = _score_play(card)
    game_data['players'][player] += points_scored
    game_data['previous_turn'] = {
        'action': 'play',
        'player': player,
        'points': points_scored
    }

    # determine next
    player_order = list(game_data['players'].keys())
    starting_point = player_order.index(game_data['current_turn'])
    players_in_order = player_order[starting_point + 1:] + player_order[:starting_point + 1]

    next_to_play = next_for_this_round(players_in_order, game_data['hands'], game_data['pegging']['passed'])
    if not next_to_play:
        game_data['players'][player] += 1
        game_data['pegging'].update({
            'cards': [],
            'last_played': '',
            'passed': [],
            'run': [],
            'total': 0
        })
        next_to_play = next_with_cards(players_in_order, game_data['hands'])

    if next_to_play:
        card_values = [game_data['cards'][card]['value'] for card in game_data['hands'][next_to_play]]
        game_data['current_action'] = play_or_pass(card_values, game_data['pegging']['total'])
        game_data['current_turn'] = next_to_play
    else:
        game_data['current_action'] = 'score'
        game_data['current_turn'] = game_data['first_to_score']

    return game_data


def record_pass(game_data, **kwargs):
    game_data['pegging']['passed'].append(kwargs['player'])

    player_order = list(game_data['players'].keys())
    starting_point = player_order.index(game_data['current_turn'])
    players_in_order = player_order[starting_point + 1:] + player_order[:starting_point + 1]
    next_to_play = next_for_this_round(players_in_order, game_data['hands'], game_data['pegging']['passed'])
    if not next_to_play:
        game_data['players'][kwargs['player']] += 1
        game_data['previous_turn'] = {
            'action': 'go',
            'amount': 1,
            'player': game_data['pegging']['last_played']
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
        card_values = [game_data['cards'][card]['value'] for card in game_data['hands'][next_to_play]]
        game_data['current_action'] = play_or_pass(card_values, game_data['pegging']['total'])
        game_data['current_turn'] = next_to_play
    else:
        game_data['current_action'] = 'score'
        game_data['current_turn'] = game_data['first_to_score']

    return game_data
