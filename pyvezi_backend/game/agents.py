from copy import deepcopy
from math import inf
import time

class Agent:
    def __init__(self):
        self.evaluate_window_function = self.evaluate_window  # Default heuristic
        self.ROWS = 6
        self.COLS = 7

    def evaluate_window(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        
        if window.count(player) == 4:
            return 99999
        elif window.count(player) == 3 and window.count(None) == 1:
            return 2
        elif window.count(player) == 2 and window.count(None) == 2:
            return 1
        elif window.count(opponent) == 3 and window.count(None) == 1:
            return -20
        elif window.count(opponent) == 4:
            return -99990
        return 0

    def easy_heuristic(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        score = 0
        if window.count(player) == 4:
            score += 99999
        elif window.count(player) == 3 and window.count(None) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(None) == 2:
            score += 5
        elif window.count(None) == 4:
            score += 2
        elif window.count(opponent) == 4:
            score -= 99990
        return score

    def medium_heuristic(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        score = 0
        if window.count(player) == 4:
            score += 99999
        elif window.count(player) == 3 and window.count(None) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(None) == 2:
            score += 5
        elif window.count(None) == 4:
            score += 2
        elif window.count(opponent) == 4:
            score -= 99990
        return score

    def expert_heuristic(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        score = 0
        if window.count(player) == 4:
            score += 99999
        elif window.count(player) == 3 and window.count(None) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(None) == 2:
            score += 5
        elif window.count(None) == 4:
            score += 2
        elif window.count(opponent) == 4:
            score -= 99990
        return score

    def count_windows(self, board, player):       
        score = 0
        # Horizontal windows
        for row in range(len(board)):
            for col in range(len(board[0]) - 3):
                window = [board[row][col + i] for i in range(4)]
                score += self.evaluate_window_function(window, player)

        # Vertical windows
        for row in range(len(board) - 3):
            for col in range(len(board[0])):
                window = [board[row + i][col] for i in range(4)]
                score += self.evaluate_window_function(window, player)

        # Diagonal windows (down-right)
        for row in range(len(board) - 3):
            for col in range(len(board[0]) - 3):
                window = [board[row + i][col + i] for i in range(4)]
                score += self.evaluate_window_function(window, player)

        # Diagonal windows (down-left)
        for row in range(len(board) - 3):
            for col in range(3, len(board[0])):
                window = [board[row + i][col - i] for i in range(4)]
                score += self.evaluate_window_function(window, player)

        return score

    def evaluate_state(self, board):
        return self.count_windows(board, 'red') - self.count_windows(board, 'yellow')

    def is_game_over(self, board, maximizing_player):
        return "equal" if all(cell is not None for row in board for cell in row) else self.check_winner(board, maximizing_player)

    def check_winner(self, board, maximizing_player):
        player, opponent = ('red', 'yellow') if maximizing_player else ('yellow', 'red')
        # Check horizontal
        for row in range(len(board)):
            for col in range(len(board[0]) - 3):
                if all(board[row][col + i] == player for i in range(4)):
                    return player

        # Check vertical
        for row in range(len(board) - 3):
            for col in range(len(board[0])):
                if all(board[row + i][col] == player for i in range(4)):
                    return player

        # Check diagonal (down-right)
        for row in range(len(board) - 3):
            for col in range(len(board[0]) - 3):
                if all(board[row + i][col + i] == player for i in range(4)):
                    return player

        # Check diagonal (down-left)
        for row in range(len(board) - 3):
            for col in range(3, len(board[0])):
                if all(board[row + i][col - i] == player for i in range(4)):
                    return player

        return False

    def get_valid_columns(self, board):
        valid_columns = []
        for col in range(self.COLS):
            if board[0][col] is None:  # If top row of column is empty
                valid_columns.append(col)
        return valid_columns

    def get_next_open_row(self, board, col):
        for row in range(self.ROWS - 1, -1, -1):
            if board[row][col] is None:
                return row
        return None

    def simulate_move(self, board, col, maximizing_player):
        new_board = deepcopy(board)
        row = self.get_next_open_row(new_board, col)
        if row is not None:
            new_board[row][col] = 'red' if maximizing_player else 'yellow'
        return new_board

class MinMaxABAgent(Agent):
    def get_chosen_column(self, board, max_depth, heuristic='medium'):
        if heuristic == 'easy':
            self.evaluate_window_function = self.easy_heuristic
        elif heuristic == 'medium':
            self.evaluate_window_function = self.medium_heuristic
        elif heuristic == 'expert':
            self.evaluate_window_function = self.expert_heuristic

        def minimax(board, depth, alpha, beta, maximizing_player):
            if depth == 0 or self.is_game_over(board, maximizing_player):
                finish_state = self.is_game_over(board, maximizing_player)
                if finish_state == "red":
                    return inf, None
                if finish_state == "yellow":
                    return -inf, None
                if finish_state == "equal":
                    return 0, None
                return self.evaluate_state(board), None

            valid_columns = self.get_valid_columns(board)
            if not valid_columns:
                return 0, None

            if maximizing_player:
                max_eval = float('-inf')
                best_col = valid_columns[0]
                for col in valid_columns:
                    new_board = self.simulate_move(board, col, maximizing_player)
                    eval, _ = minimax(new_board, depth - 1, alpha, beta, False)
                    if eval > max_eval:
                        max_eval = eval
                        best_col = col
                    alpha = max(alpha, eval)
                    if beta <= alpha:
                        break
                return max_eval, best_col
            else:
                min_eval = float('inf')
                best_col = valid_columns[0]
                for col in valid_columns:
                    new_board = self.simulate_move(board, col, maximizing_player)
                    eval, _ = minimax(new_board, depth - 1, alpha, beta, True)
                    if eval < min_eval:
                        min_eval = eval
                        best_col = col
                    beta = min(beta, eval)
                    if beta <= alpha:
                        break
                return min_eval, best_col

        time_start = time.time()
        _, best_col = minimax(board, max_depth, float('-inf'), float('inf'), True)
        elapsed_time = time.time() - time_start
        return best_col, elapsed_time

class NegScoutAgent(Agent):
    def get_chosen_column(self, board, max_depth, heuristic='medium'):
        if heuristic == 'easy':
            self.evaluate_window_function = self.easy_heuristic
        elif heuristic == 'medium':
            self.evaluate_window_function = self.medium_heuristic
        elif heuristic == 'expert':
            self.evaluate_window_function = self.expert_heuristic

        def negscout(board, depth, alpha, beta, maximizing_player):
            if depth == 0 or self.is_game_over(board, maximizing_player):
                finish_state = self.is_game_over(board, maximizing_player)
                if finish_state == "red":
                    return inf, None
                if finish_state == "yellow":
                    return -inf, None
                if finish_state == "equal":
                    return 0, None
                return self.evaluate_state(board), None

            valid_columns = self.get_valid_columns(board)
            if not valid_columns:
                return 0, None

            best_col = valid_columns[0]
            score = float('-inf') if maximizing_player else float('inf')

            for i, col in enumerate(valid_columns):
                new_board = self.simulate_move(board, col, maximizing_player)

                if i == 0:
                    eval, _ = negscout(new_board, depth - 1, -beta, -alpha, not maximizing_player)
                    eval = -eval
                else:
                    eval, _ = negscout(new_board, depth - 1, -alpha - 1, -alpha, not maximizing_player)
                    eval = -eval
                    if alpha < eval < beta:
                        eval, _ = negscout(new_board, depth - 1, -beta, -eval, not maximizing_player)
                        eval = -eval

                if maximizing_player:
                    if eval > score:
                        score = eval
                        best_col = col
                    alpha = max(alpha, eval)
                else:
                    if eval < score:
                        score = eval
                        best_col = col
                    beta = min(beta, eval)

                if alpha >= beta:
                    break

            return score, best_col

        time_start = time.time()
        _, best_col = negscout(board, max_depth, float('-inf'), float('inf'), True)
        elapsed_time = time.time() - time_start
        return best_col, elapsed_time



class CompVsComp:
    def __init__(self, red_heuristic='medium', yellow_heuristic='medium', alg1="minmax", alg2="minmax", depth1=4, depth2=4, rows=6, cols=7):
        self.rows = rows
        self.cols = cols
        self.depth1 = depth1
        self.depth2 = depth2
        self.board = [[None for _ in range(cols)] for _ in range(rows)]
        self.moves_played = []

        # Initialize agents based on the specified algorithms
        if alg1 == "negscout":
            self.red_agent = NegScoutAgent()
        else:  # Default to MinMax
            self.red_agent = MinMaxABAgent()

        if alg2 == "negscout":
            self.yellow_agent = NegScoutAgent()
        else:  # Default to MinMax
            self.yellow_agent = MinMaxABAgent()

        # Assign heuristic functions based on specified levels
        self.red_agent.evaluate_window_function = self.get_heuristic_function(self.red_agent, red_heuristic)
        self.yellow_agent.evaluate_window_function = self.get_heuristic_function(self.yellow_agent, yellow_heuristic)

    def get_heuristic_function(self, agent, heuristic_level):
        if heuristic_level == 'easy':
            return agent.easy_heuristic
        elif heuristic_level == 'expert':
            return agent.expert_heuristic
        else:  # Default to medium
            return agent.medium_heuristic

    def play_game(self):
        current_player = 'red'
        while True:
            # Check if the game is over
            result = self.red_agent.is_game_over(self.board, current_player == 'red')
            if result:
                if result == "equal":
                    return "Draw", self.moves_played
                return result, self.moves_played

            # Determine the current agent and depth
            if current_player == 'red':
                agent = self.red_agent
                max_depth = self.depth1
            else:
                agent = self.yellow_agent
                max_depth = self.depth2

            # Get the next move
            move_and_time = agent.get_chosen_column(self.board, max_depth=max_depth)
            move = move_and_time[0]
            if move:
                # Update the board with the chosen move
                self.board[move[0]][move[1]] = current_player
                self.moves_played.append(move_and_time)

            # Switch the current player
            current_player = 'yellow' if current_player == 'red' else 'red'
