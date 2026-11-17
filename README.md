# Dictation Practice — English with Ehsan

A small website for spelling / dictation practice. No server, no install: plain HTML, CSS and JavaScript.

## Features

- **New word** – the trainer types a word (and an optional meaning). The learner hears it and types it 10 times.
  The box turns green while the spelling is on track and red when it goes wrong. After 10 tries the word is saved to the library.
- **Review** – practise words from the library. The word is read aloud and hidden; the learner types it.
  Weaker words appear more often. At the end you see the accuracy for the round and the total score for the day.
- **Library** – all words with accuracy and number of tries. Search, delete, export and import a backup file.
- **Today** – score, accuracy, tries and new words for today, plus the last 7 days.

Scoring: each correct answer = 10 points. Checking ignores upper/lower case and extra spaces.

## Data

Everything is saved in the browser (`localStorage`). Each person / device has their own library.
Use **Export** and **Import** in the Library tab to move words between devices.

## Put it online with GitHub Pages

1. Create a new public repository on GitHub, for example `dictation-practice`.
2. Upload `index.html`, `style.css`, `app.js` and this `README.md`.
3. In the repository go to **Settings → Pages**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. After a minute the site is live at `https://<your-username>.github.io/dictation-practice/`.

## Run locally

Open `index.html` in any modern browser (Chrome or Edge recommended for the voice).
