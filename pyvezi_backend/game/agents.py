from math import inf
import time
import numpy as np

class BaseAgent:
    def __init__(self):
        self.ROWS = 6
        self.COLS = 7
        self.transposition_table = {}

    def evaluate_window(self, window, player):
        score = 0
        opponent = 2 if player == 1 else 1
        if window.count(opponent) == 4:
            score -=1000
        elif window.count(player) == 4:
            score += 1000
        elif window.count(player) == 3 and window.count(0) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(0) == 2:
            score += 5

        if window.count(opponent) == 3 and window.count(0) == 1:
            score -= 50

        return score
    def get_critical_move(self, board):
        valid_columns = self.get_valid_columns(board)
        for col in valid_columns:
            test_board = self.simulate_move(board, col, 1)
            if self.is_terminal(test_board):
                return col

        for col in valid_columns:
            test_board = self.simulate_move(board, col, 2)
            if self.is_terminal(test_board):
                return col

        return None

    def evaluate_position(self, board, player):
        score = 0
        board_array = np.array(board)

        for row in range(self.ROWS):
            for col in range(self.COLS - 3):
                window = list(board_array[row, col:col + 4])
                score += self.evaluate_window(window, player)

        for row in range(self.ROWS - 3):
            for col in range(self.COLS):
                window = list(board_array[row:row + 4, col])
                score += self.evaluate_window(window, player)

        for row in range(self.ROWS - 3):
            for col in range(self.COLS - 3):
                window = list(board_array[range(row, row + 4), range(col, col + 4)])
                score += self.evaluate_window(window, player)

        for row in range(self.ROWS - 3):
            for col in range(3, self.COLS):
                window = list(board_array[range(row, row + 4), range(col, col - 4, -1)])
                score += self.evaluate_window(window, player)

        center_array = list(board_array[:, self.COLS // 2])
        score += center_array.count(player) * 300

        adjacent_center_cols = [self.COLS // 2 - 1, self.COLS // 2 + 1]
        for col in adjacent_center_cols:
            adjacent_center_array = list(board_array[:, col])
            score += adjacent_center_array.count(player) * 150

        return score

    def evaluate_state(self, board):
        return self.evaluate_position(board, 1) - self.evaluate_position(board, 2)

    def is_terminal(self, board):
        board_array = np.array(board)

        for row in range(self.ROWS):
            for col in range(self.COLS - 3):
                window = board_array[row, col:col + 4]
                if np.all(window == 1) or np.all(window == 2):
                    return True

        for row in range(self.ROWS - 3):
            for col in range(self.COLS):
                window = board_array[row:row + 4, col]
                if np.all(window == 1) or np.all(window == 2):
                    return True

        for row in range(self.ROWS - 3):
            for col in range(self.COLS - 3):
                window = [board_array[row + i][col + i] for i in range(4)]
                if np.all(np.array(window) == 1) or np.all(np.array(window) == 2):
                    return True

        for row in range(self.ROWS - 3):
            for col in range(3, self.COLS):
                window = [board_array[row + i][col - i] for i in range(4)]
                if np.all(np.array(window) == 1) or np.all(np.array(window) == 2):
                    return True

        return all(cell != 0 for row in board for cell in row)

    def get_valid_columns(self, board):
        valid_cols = []
        center_col = self.COLS // 2
        for col in range(self.COLS):
            if board[0][col] == 0:
                valid_cols.append((col, abs(col - center_col)))
        valid_cols.sort(key=lambda x: x[1])
        return [col for col, _ in valid_cols]

    def sort_columns_by_heuristic(self, board, valid_columns, current_player):
        scores = []
        for col in valid_columns:
            simulated_board = self.simulate_move(board, col, current_player)
            score = self.evaluate_position(simulated_board, current_player)
            scores.append((col, score))
        scores.sort(key=lambda x: x[1], reverse=True)
        return [col for col, _ in scores]

    def simulate_move(self, board, col, player):
        new_board = [row[:] for row in board]
        for row in range(self.ROWS - 1, -1, -1):
            if new_board[row][col] == 0:
                new_board[row][col] = player
                return new_board
        return new_board

    def is_critical_move(self, board, col, player):
        simulated_board = self.simulate_move(board, col, player)
        return self.is_terminal(simulated_board)

class MinMaxABAgent(BaseAgent):
    def get_chosen_column(self, board, max_depth):
        self.transposition_table.clear()
        critical_move = self.get_critical_move(board)
        if critical_move is not None:
            return critical_move, 0

        def minimax(board, depth, alpha, beta, maximizing_player):
            board_hash = tuple(tuple(row) for row in board)
            if board_hash in self.transposition_table and self.transposition_table[board_hash][0] >= depth:
                return self.transposition_table[board_hash][1:]

            if depth == 0 or self.is_terminal(board):
                score = self.evaluate_state(board)
                return score, None

            valid_columns = self.get_valid_columns(board)
            if not valid_columns:
                return 0, None

            current_player = 1 if maximizing_player else 2
            valid_columns = self.sort_columns_by_heuristic(board, valid_columns, current_player)

            best_col = valid_columns[0]
            value = -inf if maximizing_player else inf

            for col in valid_columns:
                new_board = self.simulate_move(board, col, current_player)
                eval_score, _ = minimax(new_board, depth - 1, alpha, beta, not maximizing_player)

                if maximizing_player and eval_score > value:
                    value = eval_score
                    best_col = col
                    alpha = max(alpha, value)
                elif not maximizing_player and eval_score < value:
                    value = eval_score
                    best_col = col
                    beta = min(beta, value)

                if alpha >= beta:
                    break

            self.transposition_table[board_hash] = (depth, value, best_col)
            return value, best_col

        time_start = time.time()
        _, best_col = minimax(board, max_depth, -inf, inf, True)
        return best_col, time.time() - time_start

class NegaScoutAgent(BaseAgent):
    def get_chosen_column(self, board, max_depth):
        self.transposition_table.clear()
        critical_move = self.get_critical_move(board)
        if critical_move is not None:
            return critical_move, 0

        def negascout(board, depth, alpha, beta, color):
            board_hash = tuple(tuple(row) for row in board)
            if board_hash in self.transposition_table and self.transposition_table[board_hash][0] >= depth:
                return self.transposition_table[board_hash][1:]

            if depth == 0 or self.is_terminal(board):
                score = self.evaluate_state(board) * color
                return score, None

            valid_columns = self.get_valid_columns(board)
            if not valid_columns:
                return 0, None

            current_player = 1 if color == 1 else 2
            valid_columns = self.sort_columns_by_heuristic(board, valid_columns, current_player)

            best_col = valid_columns[0]
            a = alpha
            score = -inf

            for i, col in enumerate(valid_columns):
                new_board = self.simulate_move(board, col, current_player)

                if i == 0:
                    eval_score, _ = negascout(new_board, depth - 1, -beta, -a, -color)
                else:
                    eval_score, _ = negascout(new_board, depth - 1, -a - 1, -a, -color)
                    if a < eval_score < beta:
                        eval_score, _ = negascout(new_board, depth - 1, -beta, -eval_score, -color)

                eval_score = -eval_score

                if eval_score > score:
                    score = eval_score
                    best_col = col

                a = max(a, score)
                if a >= beta:
                    break

            self.transposition_table[board_hash] = (depth, score, best_col)
            return score, best_col

        time_start = time.time()
        _, best_col = negascout(board, max_depth, -inf, inf, 1)
        return best_col, time.time() - time_start
