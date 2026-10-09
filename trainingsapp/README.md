# Trainings-App

Persönliche Trainings-App (Hyrox, ATHX). Spezifikation: `docs/spec.md`. Stand: Wochenplan als Startseite.

## Befehle

```
npm install
npm run dev        # Entwicklung
npm test           # Tests
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

Als PWA installieren braucht HTTPS (oder localhost). Den Ordner `dist/` auf einen beliebigen statischen HTTPS-Host legen.

## Wochenplan

Startseite ist der Wochenplan (Mo bis So). Pro Tag Fokus oder Ruhetag wählen, vergangene Tage als gemacht markieren. `src/domain/week.ts` schlägt die freien Tage vor: Erholung pro Bereich (Oberkörper, Beine, Ausdauer), maximal 3 Trainingstage in Folge, maximal 5 Einheiten pro Woche, Wochenmix je nach Ziel (3 bis 6 Einheiten). Am Trainingstag erstellt der Plangenerator die Einheit aus Fokus, Ort und Zeit.

## Aufbau

- `src/domain/` Übungsliste, Orte/Equipment, Vorlagen, Plangenerator, Entwurf, 1RM, Übungsindex
- `src/db/` `Storage`-Interface, IndexedDB-Umsetzung (`idb.ts`), Backup-Format
- `src/ui/` Ansichten ohne Framework

Equipment pro Ort: `src/domain/locations.ts`. Übungen: `src/domain/exercises.ts`. Vorlagen: `src/domain/templates.ts`.
