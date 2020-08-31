import pytest

from app.cards import CARDS


@pytest.fixture(scope="module")
def two_player_game_unstarted():
    return {
        'name': 'cheers',
        'state': 'INIT',
        'players': {'sam': 0, 'diane': 0}
    }


@pytest.fixture(scope="module")
def three_player_game_unstarted():
    return {
        'name': 'cheers',
        'state': 'INIT',
        'players': {'sam': 0, 'diane': 0,'norm': 0}
    }

@pytest.fixture(scope="module")
def two_player_game_fully_dealt():
    return {
        'cards': CARDS,
        'crib': ['04a70825ff', '5c6bdd4fee', '9aa045dd99', 'bd4b01946d'],
        'cutter': 'brendon',
        'dealer': 'jason',
        'deck': ['d00bb3f3b7', '64fe85d796', 'fc0f324620', '276f33cf69', '04f17d1351', 'f6571e162f', 'de1c863a7f',
                 'a482167f2a', 'ce46b344a3', 'ae2caea4bb', '4dfe41e461', '597e4519ac', 'c88623fa16', 'e26d0bead3',
                 'dd3749a1bc', '83ef982410', '4c8519af34', '6d95c18472', 'b1fb3bec6f', 'c88523b677', '32f7615119',
                 'd7ca85cf5e', '30e1ddb610', '85ba715700', 'a6a3e792b4', '1d5eb77128', '110e6e5b19', 'd1c9fde8ef',
                 '75e734d054', '36493dcc05', 'e356ece3fc', '95f92b2f0c', 'def8effef6', '60575e1068', '9eba093a9d',
                 'a20b6dac2c', 'f696d1f2d3', 'fa0873dd7d', 'ff2de622d8', '3698fe0420'],
        'first_to_score': 'brendon',
        'hand_size': 6,
        'hands': {
            'brendon': ['4de6b73ab8', 'e4fc8b9004', '5e1e7e60ab', 'ace1293f8a'],
            'jason': ['d3a2460e93', '56594b3880', '4f99bf15e5', 'c6f4900f82']},
        'jokers': False,
        'name': 'homemovies',
        'ok_with_next_round': [],
        'pegging': {'cards': [], 'passed': [], 'run': [], 'total': 0},
        'play_again': [],
        'played_cards': {'brendon': [], 'jason': []},
        'players': {'brendon': 0, 'jason': 0},
        'scored_hands': [],
        'state': 'CUT',
        'turn': 'jason',
        'winning_score': 121
    }


@pytest.fixture(scope="module")
def one_player_winning_game_dict():
    return {'name': 'hfduhaag', 'players': {'zach': 2}, 'state': 'INIT', 'type': 'cribbage', 'crib': ['04a70825ff', '276f33cf69', '9eba093a9d', 'c88523b677'], 'current_action': 'play', 'current_turn': 'zach', 'cut_card': '83ef982410', 'cutter': 'zach', 'dealer': 'zach', 'deck': ['bd4b01946d', 'e26d0bead3', 'e356ece3fc', 'a6a3e792b4', '36493dcc05', '5e1e7e60ab', 'a482167f2a', 'f6571e162f', '9aa045dd99', '4dfe41e461', 'd7ca85cf5e', 'def8effef6', 'f696d1f2d3', 'dd3749a1bc', 'ff2de622d8', '75e734d054', 'e4fc8b9004', '4f99bf15e5', 'd3a2460e93', '5c6bdd4fee', 'd00bb3f3b7', '95f92b2f0c', '6d95c18472', '110e6e5b19', '04f17d1351', '56594b3880', 'a20b6dac2c', '1d5eb77128', 'de1c863a7f', 'c6f4900f82', '30e1ddb610', '64fe85d796', 'ce46b344a3', '4c8519af34', 'd1c9fde8ef', 'c88623fa16', 'b1fb3bec6f', '3698fe0420', '85ba715700', '32f7615119', '4de6b73ab8', 'ae2caea4bb', '597e4519ac'], 'deck_type': 'standard', 'first_to_score': 'zach', 'hand_size': 6, 'hands': {'zach': ['ace1293f8a']}, 'jokers': False, 'ok_with_next_round': [], 'pegging': {'cards': ['fc0f324620', 'fa0873dd7d', '60575e1068'], 'passed': [], 'run': [], 'total': 19, 'last_played': 'zach'}, 'play_again': [], 'played_cards': {'zach': ['60575e1068', 'fa0873dd7d', 'fc0f324620']}, 'post_deal_action': 'discard', 'previous_turn': {'action': 'the four of clubs', 'player': 'zach', 'points': 0, 'reason': ''}, 'rematch': True, 'scored_hands': [], 'scoring_stats': {'zach': {'a_play': 0, 'b_hand': 0, 'c_crib': 0}}, 'winning_score': 12, 'low_cut': 'the ace of hearts', 'opening_message': 'the ace of hearts is the lowest cut, so zach deals first!', 'winner': 'zach'}