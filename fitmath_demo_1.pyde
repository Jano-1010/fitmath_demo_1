import random

# Globale Variablen
game_state = "start"  # Spielzustände: "start", "question", "feedback", "show_solution", "end"
current_question = ""
correct_answer = 0
user_answer = ""
feedback = ""
score = 0
total_questions = 0
max_questions = 7
exercise = ""
repetitions = 0

# Liste möglicher Übungen
exercises = ["Liegestütze", "Kniebeugen", "Rumpfbeugen", "Hampelmänner", "Ausfallschritte"]

def setup():
    global exercise
    size(650, 500)  # Fenstergrösse festlegen
    textSize(20)    # Textgrösse setzen
    exercise = random.choice(exercises)  # Eine zufällige Übung beim Start des Spiels auswählen

def draw():
    # Hintergrundfarbe basierend auf dem Spielzustand setzen
    if game_state == "end":
        background(0xC6, 0xE2, 0xFF)  # Hintergrundfarbe #C6E2FF bei Spielende
    else:
        background(0xB4, 0xCD, 0xCD)  # Hintergrundfarbe #B4CDCD im Spiel
            
    fill(0)  # Schriftfarbe auf Schwarz setzen
    
    if game_state == "start":
        display_start_screen()
    elif game_state == "question":
        display_question()
    elif game_state == "feedback":
        display_feedback()
    elif game_state == "show_solution":
        display_solution()
    elif game_state == "end":
        display_end_screen()

def display_start_screen():
    textAlign(CENTER, CENTER)
    text("Willkommen zum Kopfrechentrainer!", width / 2, height / 2 - 40)
    text("Klicke Enter, um zu beginnen", width / 2, height / 2)

def start_game():
    global score, total_questions, game_state
    score = 0
    total_questions = 0
    game_state = "question"
    generate_question()

def generate_question():
    global current_question, correct_answer, user_answer
    # Neue Frage generieren
    a = random.randint(1, 20)
    b = random.randint(1, 20)
    operation = random.choice(["+", "-"])
    # Frage als String zusammensetzen
    current_question = str(a) + " " + operation + " " + str(b)
    
    # Richtige Antwort berechnen
    if operation == "+":
        correct_answer = a + b
    else:
        correct_answer = a - b
    
    user_answer = ""  # Benutzereingabe zurücksetzen

def display_question():
    textAlign(CENTER, CENTER)
    # Frage anzeigen in der Mitte des Fensters
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
    
    # Überprüfen, ob das Spiel vorbei ist
    if total_questions >= max_questions:
        game_state = "show_solution"  # Nach der letzten Frage zuerst die Lösung anzeigen
    else:
        game_state = "feedback"

def display_feedback():
    textAlign(CENTER, CENTER)
    text(feedback, width / 2, height / 2 - 20)
    text("(Klicke Enter, um neue Rechnung anzuzeigen)", width / 2, height / 2 + 20)
    # Zähler für richtige Antworten anzeigen
    text("Richtige Antworten: " + str(score) + " / " + str(total_questions), width / 2, height / 2 + 60)
    
def display_solution():
    textAlign(CENTER, CENTER)
    # Feedback und Lösung anzeigen
    text(feedback, width / 2, height / 2 - 20)    
    text("Klicke Enter, um die Endauswertung anzuzeigen)", width / 2, height / 2 + 20)

def display_end_screen():
    global repetitions
    textAlign(CENTER, CENTER)
    text("Spiel beendet!", width / 2, height / 2 - 60)
    text("Du hast " + str(score) + " von " + str(max_questions) + " Fragen richtig beantwortet.", width / 2, height / 2-20)
    
    # Wiederholungen berechnen
    repetitions = max(2, 10 - score * 2)  # Mindestanzahl der Wiederholungen ist 2
    
    # Übung und Wiederholungen anzeigen
    text("Aufgabe: " + exercise, width / 2, height / 2 + 20)v
    text("Wiederholungen: " + str(repetitions), width / 2, height / 2 + 60)fgz
    text("Klicke Enter, um neu zu starten.", width / 2, height / 2 + 100)

def keyPressed():
    global game_state, user_answer
    if game_state == "start":
        start_game()
    elif game_state == "question":
        if key == ENTER:
            check_answer()
        elif key == BACKSPACE:
            user_answer = user_answer[:-1]
        elif key.isdigit() or (key == '-' and len(user_answer) == 0): # Minuszeichen nur am Anfang erlauben
            user_answer += key
    elif game_state == "feedback":
        game_state = "question"
        generate_question()g
    elif game_state == "show_solution":
        game_state = "end"  # Nach der Lösung zur Endauswertung wechseln
    elif game_state == "end":
        game_state = "start"
