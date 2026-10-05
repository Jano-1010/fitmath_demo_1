# Trainings-App

Persönliche Trainings-App (Hyrox, ATHX). Spezifikation: `docs/spec.md`. Stand: **Stufe 1**.

## Befehle

```
npm install
npm run dev        # Entwicklung
npm test           # Tests
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
```

Als PWA installieren braucht HTTPS (oder localhost). Den Ordner `dist/` auf einen beliebigen statischen HTTPS-Host legen.

## Aufbau

- `src/domain/` Übungsliste, Orte/Equipment, Vorlagen, Plangenerator, Entwurf, 1RM, Übungsindex
- `src/db/` `Storage`-Interface, IndexedDB-Umsetzung (`idb.ts`), Backup-Format
- `src/ui/` Ansichten ohne Framework

Equipment pro Ort: `src/domain/locations.ts`. Übungen: `src/domain/exercises.ts`. Vorlagen: `src/domain/templates.ts`.
