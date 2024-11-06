import random

# Globale Variablen
current_question = ""
correct_answer = 0
user_answer = ""
feedback = ""
game_state = "question"

def setup():
    size(600, 400)  # Fenstergröße festlegen
    textSize(20)    # Textgröße setzen
    generate_question()

def draw():
    background(0xB4, 0xCD, 0xCD)  # Hintergrundfarbe #B4CDCD im Spiel
    fill(0)  # Schriftfarbe auf Schwarz setzen
    
    if game_state == "question":
        display_question()
    elif game_state == "feedback":
        display_feedback()

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
    text("Rechnung:", width / 2, height / 2 - 40)
    text(current_question, width / 2, height / 2)
    text("Deine Antwort: " + user_answer, width / 2, height / 2 + 40)
    text("Drücke Enter zum Bestätigen", width / 2, height / 2 + 80)

def check_answer():
    global feedback, game_state
    try:
        if int(user_answer) == correct_answer:
            feedback = "Richtig!"
        else:
            feedback = "Falsch! Die richtige Antwort war " + str(correct_answer) + "."
    except ValueError:
        feedback = "Bitte eine Zahl eingeben!"
    
    game_state = "feedback"

def display_feedback():
    textAlign(CENTER, CENTER)
    text(feedback, width / 2, height / 2)
    text("Drücke Enter für eine neue Rechnung", width / 2, height / 2 + 40)

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
