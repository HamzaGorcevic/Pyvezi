from django.http import JsonResponse
from .agents import MinMaxABAgent,NegaScoutAgent
import json
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def computer_move(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        board = data.get('board')
        mode = request.GET.get('mode', 'easy')  
        algorithm = request.GET.get('algorithm', 'minmax')  

        if algorithm == "negscout":
            agent = NegaScoutAgent()
        else: 
            agent = MinMaxABAgent()

        max_depth = 2 if mode == 'easy' else 3 if mode == 'medium' else 6 if mode == 'expert' else None
        heuristic = mode if mode in ['easy', 'medium', 'expert'] else None

        if max_depth is None or heuristic is None:
            return JsonResponse({"error": "Invalid mode"}, status=400)

        computer_move = agent.get_chosen_column(board, max_depth=max_depth)
        
        return JsonResponse({"computed_move": computer_move[0], "time": computer_move[1]})
    else:
        return JsonResponse({"error": "Invalid method"}, status=400)
    
# def comp_vs_comp(request):
#     if request.method == "GET":
#         mode1 = request.GET.get("mode1")
#         mode2 = request.GET.get("mode2")
#         algorithm1 = request.GET.get("algorithm1", "minmax")  # Default to minmax if not provided
#         algorithm2 = request.GET.get("algorithm2", "minmax")  # Default to minmax if not provided

#         mode_depths = {
#             "easy": 2,
#             "medium": 5,
#             "expert": 6
#         }
#         depth1 = mode_depths.get(mode1, 5)  # Default to medium if invalid mode
#         depth2 = mode_depths.get(mode2, 5)  # Default to medium if invalid mode

#         game = CompVsComp(mode1,mode2,algorithm1,algorithm2,depth1,depth2)
#         winner,computed_moves = game.play_game()

#         return JsonResponse({"computed_moves": computed_moves, "winner": winner})
#     else:
#         return JsonResponse({"error": "Invalid method"}, status=400)
