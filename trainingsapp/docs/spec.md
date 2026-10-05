# Trainings-App – Projektauftrag für Claude Code

Diese Datei als `CLAUDE.md` oder `docs/spec.md` ins Repo legen und Claude Code damit starten.

## Rolle und Arbeitsweise

Du baust eine persönliche Trainings-App für einen Athleten. Arbeite iterativ: zuerst ein lauffähiges Grundgerüst, dann Feature für Feature. Nach jedem Schritt kurz zusammenfassen, was läuft und was offen ist. Keine Platzhalter-Daten und keine erfundenen Werte im Code.

Sprache im Code: englische Bezeichner, deutsche Oberfläche. In allen deutschen Texten "ss" statt "ß".

## Nutzerkontext

- Männlich, 104 kg, über 5 Jahre strukturiertes Kraft- und Ausdauertraining
- Ziele: Hyrox (Zielzeit 1:10:00) und ATHX Games, Kategorie ATHX (nicht Lite, nicht Pro)
- Trainiert maximal eine Einheit pro Tag, Zeitpunkt variiert (Mittag oder Abend)
- Nutzt die App am Handy, mitten im Training, oft mit nassen Händen

## Trainingsorte und Equipment

| Ort | Equipment |
|---|---|
| Gym voll | Langhantel, Kurzhanteln, Kabelzug, Rudergerät, Ski-Erg, Kettlebells, Maschinen, Box |
| Schul-Gym | Langhanteln, Kurzhanteln, Kabelzug, Klimmzugstangen, Bank, Matten |
| Minimal | Sprossenwand, Medizinball, Klimmzugstange, Körpergewicht |

Ein generierter Plan darf ausschliesslich Equipment des gewählten Orts verwenden. Das ist eine harte Regel, nicht eine Empfehlung.

## Wettkampfvorgaben ATHX (Saison 2027, Kategorie ATHX, Individual, männlich)

- **Strength Zone:** 1RM Shoulder to Overhead, 2RM Back Squat, 3RM Kreuzheben
- **Endurance:** 3 km Lauf, danach maximale Distanz Ski-Erg, 24 min Cap
- **MetCon X:** 45 cal Rudern, 30 DB Ground to Overhead 20 kg, 30 DB Bankdrücken 20 kg, 30 Sandbag Squats 50 kg, 30 m Sandbag Carry 50 kg, 30 Burpees über Bank, 45 cal Rudern, 25 min Cap

Diese Bewegungen und Lasten sind die Referenz für alle wettkampfnahen Blöcke.

## Funktionsumfang

### Stufe 1 – Grundgerüst
1. Planerstellung aus Vorlagen: Auswahl von Ort, Fokus (Oberkörper, Unterkörper, Ganzkörper, ATHX, Ausdauer) und Zeitbudget (30/45/60 min). Blöcke haben eine Priorität; bei knappem Budget fallen die mit niedriger Priorität weg.
2. Erfassung pro Satz: Gewicht in kg und Wiederholungen. Eingabefelder mit `inputmode`, Tap-Fläche mindestens 44 px.
3. Speicherung der Einheit mit Datum, Ort, Fokus und allen Sätzen.
4. Anzeige des letzten verwendeten Gewichts direkt bei jeder Übung.
5. Verlauf: Liste aller Einheiten, aufklappbar.

### Stufe 2 – Progression
6. Übungsverlauf: Diagramm des bewegten Gewichts pro Übung über die Zeit, plus geschätztes 1RM nach Epley (`kg * (1 + wdh/30)`).
7. Progressionsvorschlag beim Planaufbau: wurden beim letzten Mal alle Sätze im oberen Wiederholungsbereich geschafft, nächste Einheit +2,5 kg bei Oberkörperübungen, +5 kg bei Unterkörperübungen. Vorschlag anzeigen, nicht automatisch setzen.
8. Wochenansicht: geplante und erledigte Einheiten der laufenden Woche, mit Kennzeichnung Kraft/Ausdauer/Wettkampf.

### Stufe 3 – Planung über Wochen
9. Mesozyklus über 4 Wochen: drei Wochen steigernd, eine Entlastungswoche mit rund 60 Prozent Volumen.
10. Wettkampfdatum hinterlegen, Rückwärtsplanung bis dahin, letzte Woche deutlich reduziert.
11. Kennzahl pro Woche: Gesamtvolumen (Sätze × Wiederholungen × Gewicht) je Muskelgruppe, plus Laufkilometer und Ruderdistanz.

## Datenmodell

```
Session { id, date, location, focus, durationMin, blocks[] }
Block   { name, type: "heavy" | "accessory" | "metcon", exercises[] }
Exercise{ name, prescribedSets, prescribedReps, rest, note, sets[] }
Set     { weightKg, reps }
Exercise-Index { name -> { lastWeight, lastReps, bestE1RM, lastDate } }
```

Übungsnamen sind der Schlüssel für den Verlauf. Deshalb eine feste Übungsliste pflegen und freie Eingabe nur über eine Auswahl mit Autovervollständigung zulassen, sonst zerfällt die Historie in Schreibvarianten.

## Technische Vorgaben

- Reines Frontend, keine eigene Serverinfrastruktur. Vorschlag: Vite mit TypeScript, ohne schweres UI-Framework, oder React, falls du es für die Zustandsverwaltung brauchst.
- Persistenz: IndexedDB über eine dünne eigene Schicht, damit ein späterer Wechsel auf eine Cloud-Datenbank nur eine Datei betrifft.
- Installierbar als PWA: Manifest, Service Worker, vollständig offline nutzbar.
- Export und Import als JSON-Datei, damit nichts verloren geht.
- Dunkel- und Hellmodus über CSS-Variablen und `prefers-color-scheme`.
- Keine Analyse-Skripte, keine externen Tracker, keine Datenübertragung an Dritte.

## Qualitätskriterien

- Nach dem Öffnen steht der Plan des Tages in höchstens zwei Taps bereit.
- Eine Gewichtseingabe braucht höchstens zwei Taps und eine Zahleneingabe.
- Die App funktioniert vollständig ohne Netz.
- Beim ersten Start ohne Daten erklärt die leere Ansicht, was zu tun ist.
- Tests für die Progressionslogik und die 1RM-Berechnung.

## Reihenfolge der Umsetzung

Stufe 1 komplett und lauffähig, erst dann Stufe 2. Stufe 3 nur nach ausdrücklicher Freigabe. Keine Stufe anfangen, solange die vorherige nicht am Handy getestet ist.
