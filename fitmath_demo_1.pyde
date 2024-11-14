import random

# Globale Variablen
current_question = ""
correct_answer = 0
user_answer = ""
feedback = ""
score = 0
total_questions = 0
max_questions = 5
game_state = "question"

def setup():
    size(650, 500)  # Fenstergrösse festlegen
    textSize(20)    # Textgrösse setzen
    generate_question()

def draw():
    background(0xB4, 0xCD, 0xCD)  # Hintergrundfarbe #B4CDCD im Spiel
    fill(0)  # Schriftfarbe auf Schwarz setzen
    
    if game_state == "question":
        display_question()
    elif game_state == "feedback":
        display_feedback()
    elif game_state == "end":
        display_end_screen()

def generate_question():
    global current_question, correct_answer, user_answer
    a = random.randint(1, 20)
    b = random.randint(1, 20)
    operation = random.choice(["+", "-"])
    current_question = str(a) + " " + operation + " " + str(b)
    
    if operation == "+":
        correct_answer = a + b
    else:
        correct_answer = a - b
    
    user_answer = ""  # Benutzereingabe zurücksetzen

def display_question():
    textAlign(CENTER, CENTER)
    text("Frage " + str(total_questions + 1) + " von " + str(max_questions), width / 2, height / 2 - 60)
    text(current_question, width / 2, height / 2 - 20)
    text("Deine Antwort: " + user_answer, width / 2, height / 2 + 20)
    text("Enter, um einzuloggen.", width / 2, height / 2 + 80)
    
def check_answer():
    global feedback, score, total_questions, game_state
    total_questions += 1
    try:
        if int(user_answer) == correct_answer:
            feedback = "Richtig!"
            score += 1
        else:
            feedback = "Falsch! Die richtige Antwort war " + str(correct_answer) + "."
    except ValueError:
        feedback = "Bitte eine Zahl eingeben!"
    
    if total_questions >= max_questions:
        game_state = "end"  # Nach der letzten Frage zur Endauswertung wechseln
    else:
        game_state = "feedback"

def display_feedback():
    textAlign(CENTER, CENTER)
    text(feedback, width / 2, height / 2 - 20)
    text("Richtige Antworten: " + str(score) + " / " + str(total_questions), width / 2, height / 2 + 40)
    text("Enter, um zur nächsten Frage zu gehen", width / 2, height / 2 + 80)

def display_end_screen():
    textAlign(CENTER, CENTER)
    text("Spiel beendet!", width / 2, height / 2 - 40)
    text("Du hast " + str(score) + " von " + str(max_questions) + " Fragen richtig beantwortet.", width / 2, height / 2)

def keyPressed():
    global game_state, user_answer
    if game_state == "question":
        if key == ENTER:
            check_answer()
        elif key == BACKSPACE:
            user_answer = user_answer[:-1]
        elif key.isdigit() or (key == '-' and len(user_answer) == 0):
            user_answer += key
    elif game_state == "feedback":
        game_state = "question"
        generate_question()
    elif game_state == "end":
        game_state = "question"
        score = 0
        total_questions = 0
        generate_question()
