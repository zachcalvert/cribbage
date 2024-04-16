from itertools import chain, combinations


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
        self.breakdown = {
            "fifteens": {},
            "pairs": {},
            "threes": {},
            "fours": {},
            "runs": {},
            "flush": {},
            "nobs": {},
        }

    def __str__(self):
        s = ""
        for card in self.cards:
            s += card["name"] + " of " + card["suit"] + ", "
        s += "{} of {}".format(self.cut_card["name"], self.cut_card["suit"])
        return s

    def _power_hand(self, values):
        """
        Given a hand of 5 cards (or 4 or 6..) this method creates every
        possible combination of the cards of that hand.
        Useful for counting 15's.
        Returns a list of tuples of each possible card combination.
        """
        assert type(values) == list
        ch = chain.from_iterable(
            combinations(values, r) for r in range(len(values) + 1)
        )
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
        cards = self.cards + [self.cut_card]
        all_combos = self._power_hand(cards)
        for combo in all_combos:
            if sum([card["value"] for card in combo]) == 15:
                self.fifteens[counter] = [card["id"] for card in combo]
                counter += 2

        return self.fifteens != {}

    def _has_pairs(self):
        cards = self.cards + [self.cut_card]
        counts = {card["name"]: [] for card in cards}
        for card in cards:
            counts[card["name"]].append(card["id"])

        self.pairs = [{name: ids} for name, ids in counts.items() if len(ids) == 2]
        self.threes = [{name: ids} for name, ids in counts.items() if len(ids) == 3]
        self.fours = [{name: ids} for name, ids in counts.items() if len(ids) == 4]
        return self.pairs != [] or self.threes != [] or self.fours != []

    def _has_runs(self):
        for vector_len in [5, 4, 3]:
            for vec in combinations(self.cards + [self.cut_card], vector_len):
                vals = [card["rank"] for card in vec]
                run = [n + min(vals) for n in range(vector_len)]
                if sorted(vals) == run:
                    run = [card["id"] for card in vec]
                    add = True
                    for r in self.runs:
                        if all(card in r for card in run):
                            add = False
                    if add:
                        self.runs.append(run)
                        self.points += vector_len

        return self.runs != []

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
        jacks = [card for card in self.cards if card["name"] == "jack"]
        for jack in jacks:
            if self.cut_card["suit"] == jack["suit"]:
                self.nobs = [jack["id"], self.cut_card["id"]]
                return True
        return False

    def calculate_points(self):
        points = 0

        if self._has_fifteens():
            for fifteen, cards in self.fifteens.items():
                points += 2
                self.breakdown["fifteens"][f"fifteen {fifteen}"] = cards

        if self._has_pairs():
            for four in self.fours:
                points += 12
                rank = list(four.keys())[0]
                ids = list(four.values())[0]
                self.breakdown["fours"][f"four {rank}s for {points}"] = ids
            for three in self.threes:
                points += 6
                rank = list(three.keys())[0]
                ids = list(three.values())[0]
                self.breakdown["threes"][f"three {rank}s for {points}"] = ids
            for pair in self.pairs:
                points += 2
                rank = list(pair.keys())[0]
                ids = list(pair.values())[0]
                self.breakdown["pairs"][f"pair of {rank}s for {points}"] = ids

        if self._has_runs():
            for run in self.runs:
                points += len(run)
                self.breakdown["runs"][f"run of {len(run)} for {points}"] = run

        if self._has_flush():
            points += self.flush_points
            suit = self.cards[0]["suit"]
            ids = [card["id"] for card in self.cards]
            if self.flush_points == 5:
                ids += [self.cut_card["id"]]
            self.breakdown["flush"][f"{self.flush_points} {suit} for {points}"] = ids

        if self._has_nobs():
            points += 1
            self.breakdown["nobs"][f"nobs for {points}"] = self.nobs

        self.points = points
        return points
