# Kotoba Studio

Eine lokale Lernseite für die Quizlet-Vokabellisten aus dem Japanischkurs.

## Öffnen

`index.html` im Browser öffnen. Die Lernkarten und Kanji-Erklärungen funktionieren ohne Internet. Der Quizlet-Reiter benötigt eine Internetverbindung und zeigt das Originalset, soweit Quizlet die Einbettung zulässt.

## Inhalt

- 114 Sets und 3.598 Karten aus `../quizlet_vokabellisten.csv` (Stand: 22. September 2026)
- 4 interaktive Kursmodule aus `ABCDEFG.pdf`, `Fragewoerter.pdf`, `Japanese_numbers.pdf` und `KLG_pack_DE.pdf`
- Alphabet-Aufdeckkarten, Fragewort-Satztraining, Zahlenumwandler und ein Kompaktkurs zu Satzbau, Partikeln, Uhrzeit, Datum und Adjektiven
- Suche nach Sets und Vokabeln, Ordnerfilter, Mischen, Lernfortschritt und „Nur offene“
- Kanji-Zerlegung neben jeder Karte, einschließlich Einzelkanji aus den Kurssets und Teilwörtern, wenn sie als eigene Vokabel im Material stehen
- Ergänzende Kanji-Bedeutungen und Lesungen aus KANJIDIC, bei fehlenden deutschen Kursangaben auf Englisch gekennzeichnet
- Lernfortschritt im lokalen Browser gespeichert

Die Vokabeldefinitionen wurden aus der CSV übernommen. Offensichtliche Vertauschungen bei 午前/午後 und die Schreibweise von GAIKOKUJIN wurden beim Import korrigiert. Set-Titel mit „engl“ oder „englisch“ werden beim Erzeugen der Daten ausgelassen; in der derzeitigen CSV trifft das auf kein Set zu.

## Daten aktualisieren

Lokal eine neue vollständige CSV unter `../quizlet_vokabellisten.csv` ablegen und in PowerShell aus diesem Ordner ausführen:

```powershell
.\build-data.ps1
```

Das Skript schreibt `data.js` neu. Die Original-CSV wird nicht verändert. Die Kanji-Referenzdateien bleiben separat; neue Zeichen in späteren CSVs sollten gegen diese Referenz geprüft und gegebenenfalls ergänzt werden.

## Quellen

Die ergänzende Referenz stammt aus [kanji-data](https://github.com/davidluzgouveia/kanji-data), basierend auf [KANJIDIC](https://www.edrdg.org/wiki/KANJIDIC_Project.html) der EDRDG. `kanji-data` ist MIT-lizenziert, KANJIDIC steht unter CC BY-SA 4.0. Kursvokabeln und die zugehörigen Quizlet-Links stammen aus der bereitgestellten CSV.

Die GitHub-Pages-Version ist öffentlich erreichbar und enthält die Vokabeln in `data.js`. Der Lernfortschritt bleibt im jeweiligen Browser gespeichert und wird nicht zu GitHub übertragen.
