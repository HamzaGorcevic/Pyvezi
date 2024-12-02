from copy import deepcopy
from math import inf
import time
class Agent:
    def __init__(self):
        self.evaluate_window_function = self.evaluate_window  # Default heuristic

    def evaluate_window(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        
        if window.count(player) == 4:
            return 99999  # Win is still lower priority for simplicity
        elif window.count(player) == 3 and window.count(None) == 1:
            return 2
        elif window.count(player) == 2 and window.count(None) == 2:
            return 1
        elif window.count(opponent) == 3 and window.count(None) == 1:
            return -20  # Stronger penalty for blocking opponent
        elif window.count(opponent) == 4:
            return 99990



    def easy_heuristic(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        score = 0
        if window.count(player) == 4:
            score += 99999  # Winning move
        elif window.count(player) == 3 and window.count(None) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(None) == 2:
            score += 5
        elif window.count(None) == 4:
            score +=2
        elif window.count(opponent) == 4:
            score -= 99990

        return score
 

    def medium_heuristic(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        score = 0
        if window.count(player) == 4:
            score += 99999  # Winning move
        elif window.count(player) == 3 and window.count(None) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(None) == 2:
            score += 5
        elif window.count(None) == 4:
            score +=2
        elif window.count(opponent) == 4:
            return 99990
        return score
 
 
    def expert_heuristic(self, window, player):
        opponent = 'yellow' if player == 'red' else 'red'
        score = 0
        if window.count(player) == 4:
            score += 99999  # Winning move
        elif window.count(player) == 3 and window.count(None) == 1:
            score += 10
        elif window.count(player) == 2 and window.count(None) == 2:
            score += 5
        elif window.count(None) == 4:
            score +=2
        elif window.count(opponent) == 4:
            return 99990
        return score
    def count_windows(self, board, player):       
        score = 0
        # Horizontal windows
        for row in range(len(board)):
            for col in range(len(board[0]) - 3):
                # returning all horizontal possibilites
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
        return "equal" if all(cell is not None for row in board for cell in row) else self.check_winner(board,maximizing_player)

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

    def get_possible_moves(self, board):
        moves = []
        for col in range(len(board[0])):
            for row in range(len(board) - 1, -1, -1):
                # we go from bottom row, and we are checking up until we find first none,then we go in next column
                if board[row][col] is None:
                    moves.append([row, col])
                    break
        return moves

    def simulate_move(self, board, move, maximizing_player):
        new_board = deepcopy(board)
        new_board[move[0]][move[1]] = 'red' if maximizing_player else 'yellow'
        return new_board





class MinMaxABAgent(Agent):
    def get_chosen_column(self, board, max_depth, heuristic='medium'):
        # Set the heuristic function based on the selected difficulty
        if heuristic == 'easy':
            self.evaluate_window_function = self.easy_heuristic
        elif heuristic == 'medium':
            self.evaluate_window_function = self.medium_heuristic
        elif heuristic == 'expert':
            self.evaluate_window_function = self.expert_heuristic

        def minimax(board, depth, alpha, beta, maximizing_player):
            if depth == 0 or self.is_game_over(board, maximizing_player):
                finish_state = self.is_game_over(board,maximizing_player)
                if(finish_state  == "red"):
                    return inf,None
                if finish_state == "yellow":
                    return -inf,None
                if finish_state == "equal":
                    return 0,None
                return self.evaluate_state(board), None

            valid_moves = self.get_possible_moves(board)
            if not valid_moves:
                return 0, None

            if maximizing_player:
                max_eval = float('-inf')
                best_move = valid_moves[0]  # Default to first move
                for move in valid_moves:
                    new_board = self.simulate_move(board, move, maximizing_player)
                    eval, _ = minimax(new_board, depth - 1, alpha, beta, False)
                    if eval > max_eval:
                        max_eval = eval
                        best_move = move    
                        print("sto si igro ovde retarde crveni",max_eval,best_move)

                    alpha = max(alpha, eval)
                    if beta <= alpha:
                        break
                return max_eval, best_move
            else:
                min_eval = float('inf')
                best_move = valid_moves[0]  # Default to first move
                for move in valid_moves:
                    new_board = self.simulate_move(board, move, maximizing_player)
                    eval, _ = minimax(new_board, depth - 1, alpha, beta, True)
                    if eval < min_eval:
                        min_eval = eval
                        best_move = move
                        print("sto si igro ovde retarde zuti",min_eval,best_move)
                        
                    beta = min(beta, eval)
                    if beta <= alpha:
                        break
                return min_eval, best_move

        time_start = time.time()
        
        _, best_move = minimax(board, max_depth, float('-inf'), float('inf'), True)
        elapsed_time = time.time() - time_start
        return best_move,elapsed_time
    
class CompVsCompMinMax:
    def __init__(self, red_heuristic='medium', yellow_heuristic='medium',depth1=4,depth2=4,rows=6, cols=7):
        self.rows = rows
        self.cols = cols
        self.depth1 = depth1
        self.depth2 = depth2 
        self.red_agent = MinMaxABAgent()
        self.yellow_agent = MinMaxABAgent()
        self.red_agent.evaluate_window_function = self.red_agent.medium_heuristic
        self.yellow_agent.evaluate_window_function = self.yellow_agent.medium_heuristic
        self.board = [[None for _ in range(cols)] for _ in range(rows)]
        self.moves_played = []

        if red_heuristic == 'easy':
            self.red_agent.evaluate_window_function = self.red_agent.easy_heuristic
        elif red_heuristic == 'expert':
            self.red_agent.evaluate_window_function = self.red_agent.expert_heuristic
        if yellow_heuristic == 'easy':
            self.yellow_agent.evaluate_window_function = self.yellow_agent.easy_heuristic
        elif yellow_heuristic == 'expert':
            self.yellow_agent.evaluate_window_function = self.yellow_agent.expert_heuristic

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
