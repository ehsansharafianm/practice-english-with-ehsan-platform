# Learn English with Ehsan

A website with practice tools for learning English. No server, no install: plain HTML, CSS and JavaScript, hosted on GitHub Pages.

Live site: https://ehsansharafianm.github.io/learn-english-with-ehsan/

## Structure

```
index.html        Home page (list of practice tools)
style.css         Shared styles
dictation/        Dictation Practice
  index.html
  app.js
  words.txt       English word list for the spell check
```

Each new practice tool gets its own folder and a card on the home page.

## Dictation Practice

- **New word** – the trainer types a word (and an optional meaning). The learner hears it and types it 10 times.
  The box turns green while the spelling is on track and red when it goes wrong. After 10 tries the word is saved to the library.
- **Spell check** – when the trainer adds a word, it is checked against an English word list (about 275,000 words).
  If it looks misspelled, the site suggests corrections. The trainer can pick a suggestion, edit the word, or keep it anyway.
- **Review** – practise words from the library. The word is read aloud and hidden; the learner types it.
  Weaker words appear more often. At the end you see the accuracy for the round and the total score for the day.
- **Library** – all words with accuracy and number of tries. Search, delete, export and import a backup file.
- **Today** – score, accuracy, tries and new words for today, plus the last 7 days.

Scoring: each correct answer = 10 points. Checking ignores upper/lower case and extra spaces.

### Data

Everything is saved in the browser (`localStorage`). Each person / device has their own library.
Use **Export** and **Import** in the Library tab to move words between devices.

### Word list

`dictation/words.txt` is the SCOWL-based English list from the `word-list` package, plus common contractions,
days, months, countries and a few common names. Words are ordered from most to least common
(using `wordfreq`), so the most likely suggestions come first.

## Run locally

From this folder run `python -m http.server 8765` and open http://localhost:8765/.
(The spell check needs a web server; opening the file directly skips it.)
