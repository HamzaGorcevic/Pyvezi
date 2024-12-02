from django.http import JsonResponse
from .agents import MinMaxABAgent,CompVsCompMinMax
import json
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def computer_move(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        board = data.get('board')
        mode = request.GET.get('mode', 'easy')  

        agent = MinMaxABAgent()


        computer_move = []
        if mode == 'easy':
            max_depth = 2
            computer_move = agent.get_chosen_column(board, max_depth=max_depth, heuristic="easy")
        elif mode == 'medium':
            max_depth = 5
            computer_move = agent.get_chosen_column(board, max_depth=max_depth, heuristic="medium")
        elif mode == 'expert':
            max_depth = 6
            computer_move = agent.get_chosen_column(board, max_depth=max_depth, heuristic="expert")
        else:
            return JsonResponse({"error": "Invalid mode"}, status=400)
        return JsonResponse({"computed_move": computer_move[0],"time":computer_move[1]})
    else:
        return JsonResponse({"error": "Invalid method"}, status=400)

def comp_vs_comp(request):
    if request.method == "GET":
        mode1 = request.GET.get("mode1")
        mode2 = request.GET.get("mode2")
        mode_depths = {
            "easy": 2,
            "medium": 5,
            "expert": 6
        }

        if mode1 not in mode_depths or mode2 not in mode_depths:
            return JsonResponse({"error": "Invalid modes"}, status=400)

        depth1 = mode_depths[mode1]
        depth2 = mode_depths[mode2]

        agent = CompVsCompMinMax(mode1, mode2, depth1, depth2)
        computed_moves = agent.play_game()  
        return JsonResponse({"computed_moves": computed_moves[1], "winner": computed_moves[0]})
    else:
        return JsonResponse({"error": "Invalid method"}, status=400)
