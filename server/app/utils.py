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
    card = deck[card_id]
    return 'the {} of {}'.format(card['name'], card['suit'])


def card_object_from_text(rank, suit):
    """
    Expects text in the form: 'Ace of diamonds', 'Ten of clubs', 'Queen of spades'

    :return: card_dict of the corresponding card
    """
    suits_of_that_rank = {k: v for k, v in deck.items() if v['name'] == rank}
    card_dict = {k: v for k, v in suits_of_that_rank.items() if v['suit'] == suit}
    return card_dict
