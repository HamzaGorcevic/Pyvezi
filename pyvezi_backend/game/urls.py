from django.urls import path
from . import views  

urlpatterns = [
    path("computer_move/", views.computer_move, name="computer_move"),
    path("comp_vs_comp/", views.comp_vs_comp, name="comp_vs_comp")
]
