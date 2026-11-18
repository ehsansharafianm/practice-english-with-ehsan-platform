# Practice English with Ehsan Platform

A website with practice tools for learning English. No server, no install: plain HTML, CSS and JavaScript, hosted on GitHub Pages.

Live site: https://ehsansharafianm.github.io/practice-english-with-ehsan-platform/

## Structure

```
index.html        Home page (list of practice tools)
style.css         Shared styles
site.js           Shared top bar (logo, page tabs, light/dark slider)
account.js        Student accounts: sign-in dialog and saving to Firebase
firebase-config.js  Firebase project settings (accounts are off while empty)
firestore.rules   Database security rules (paste into the Firebase console)
favicon.svg       Logo / browser tab icon
teacher/          Teacher dashboard (all students' scores)
dictation/        Dictation Practice
  index.html
  app.js
  words.txt       English word list for the spell check
pronunciation/    Pronunciation Practice
  index.html
  app.js
  data/*.txt      American pronunciations (syllables + stress), one file per first letter
tools/build_pron.py  Builds pronunciation/data from the CMU Pronouncing Dictionary
```

Each new practice tool gets its own folder, a card on the home page, and an entry in the `PAGES` list in `site.js`.

## Dictation Practice

- **New word** – the trainer types a word (and an optional meaning). The learner hears it and types it 10 times.
  The box turns green while the spelling is on track and red when it goes wrong. The answer is checked automatically
  as soon as the last letter is typed (Enter also works). After 10 tries the word is saved to the library.
- **Spell check** – when the trainer adds a word, it is checked against an English word list (about 275,000 words).
  If it looks misspelled, the site suggests corrections. The trainer can pick a suggestion, edit the word, or keep it anyway.
- **Review** – practise words from the library. The word is read aloud and hidden; the learner types it.
  Weaker words appear more often. At the end you see the accuracy for the round and the total score for the day.
- **Library** – all words with accuracy and number of tries. Search, delete, export and import a backup file.
- **Today** – score, accuracy, tries and new words for today, plus the last 7 days.

Scoring: each correct answer = 10 points. Checking ignores upper/lower case and extra spaces.

### Data

Guests: everything is saved in the browser (`localStorage`), so each device has its own library.
Use **Export** and **Import** in the Library tab to move words between devices.

Signed-in students: words and scores are also saved to their account (Firestore), so they work on any
device and the teacher can see them. Guest practice on a device moves into the account at first sign-in.

## Student accounts and teacher dashboard

Sign-in is optional (Google or email + password). The teacher dashboard is at `/teacher/`.

Setup (once):
1. Create a Firebase project. Turn on **Authentication** with the **Google** and **Email/Password** providers,
   and add `ehsansharafianm.github.io` under *Authentication → Settings → Authorized domains*.
2. Create a **Firestore** database (production mode) and publish the rules from `firestore.rules`.
3. Register a web app and paste its `firebaseConfig` values into `firebase-config.js`.
4. Sign in on the site once, then in Firestore create a collection `teachers` with a document whose ID is
   your user ID (shown on the teacher page). That account can now open the dashboard.

Each student is one document `users/{uid}` with `name`, `email`, `words`, `days`, `createdAt`, `lastActive`,
and `pron` (Pronunciation Practice words and days).

### Word list

`dictation/words.txt` is the SCOWL-based English list from the `word-list` package, plus common contractions,
days, months, countries and a few common names. Words are ordered from most to least common
(using `wordfreq`), so the most likely suggestions come first.

## Pronunciation Practice

- **Add new word** – type a word, or click **Say a word** and say it (the page shows what it heard, with other
  guesses, "say it again" and "type it instead"); typed words get a spelling check is checked, with suggestions, or keep it anyway) to see its American pronunciation: IPA phonetics, the syllables, and which syllable
  is stressed (the big coloured one; secondary stress has a coloured border). Each syllable also has a simple
  "sounds like" spelling (e.g. pruh · nun · see · AY · shuhn). Listen with a woman's or a man's US voice (normal or
  slow),. Then click **Say it**: the browser checks what you
  said (Chrome/Edge), and the page analyses your recording (loudness, pitch and length of each syllable) to see
  which syllable you stressed. You get a match score, a bar chart of your stress against the correct stress, and tips.
  You can play back your own voice to compare. The analysis is approximate: it checks stress, not single sounds. Looked-up words are saved to **My words**.
- **Practice** – "Say the word" (3 tries per word) or "Find the stress" (click the stressed syllable),
  with words from My words, from Dictation, or both. Weaker words come first. 10 points per correct answer.
- **My words** – all words with phonetics and how often you got them right, plus today's totals.

Pronunciations come from the CMU Pronouncing Dictionary (BSD licence), split into syllables by `tools/build_pron.py`
(`python tools/build_pron.py cmudict.dict pronunciation/data`). Phonetics for words missing from the list come from the free dictionaryapi.dev. Voices are the device's own; Microsoft Edge has the most natural ones.
Signed-in students' pronunciation data is saved in the `pron` field of their `users/{uid}` document.

## Run locally

From this folder run `python -m http.server 8765` and open http://localhost:8765/.
(The spell check needs a web server; opening the file directly skips it.)
