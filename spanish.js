/* Spanish (Spain) pronunciation from spelling — Practice with Sharaf
 * Spanish spelling is regular, so syllables, stress and IPA can be worked out from the written word:
 *   ES_PRON.syllables('gracias') -> [{ text: 'gra', ipa: 'ɡɾa', stress: 0 }, { text: 'cias', ipa: 'θjas', stress: 1 }]
 *   ES_PRON.ipa('ciudad')        -> 'θjuˈðað'
 *   ES_PRON.key('vaca') === ES_PRON.key('baca')   (same sounds: for "did the learner say it?")
 *   ES_PRON.linkNotes(text), ES_PRON.soundTips(words)  -> short tips in English (HTML)
 * Accent: Castilian (Spain): c/z = θ, j = x, ll = y (yeísmo), b/d/g soft between vowels.
 */
(function () {
  'use strict';

  const ACC = 'áéíóú';
  const VOW = 'aeiouáéíóúü';
  const isV = (c) => VOW.includes(c);
  const FRONT = 'eiéí';
  const strong = (c) => 'aeoáéóíú'.includes(c); // accented í/ú break a diphthong, so they count as strong
  const ONSET2 = new Set(['pr', 'br', 'tr', 'dr', 'cr', 'kr', 'gr', 'fr', 'pl', 'bl', 'cl', 'kl', 'gl', 'fl']);
  const lower = (w) => String(w || '').toLowerCase().normalize('NFC').replace(/[^a-záéíóúüñ]/g, '');

  // Letters -> units: one consonant sound (ch, ll, rr, qu, gu count as one) or one vowel letter.
  function units(w) {
    const out = [];
    for (let i = 0; i < w.length; i++) {
      const c = w[i], n = w[i + 1] || '', two = c + n;
      if (two === 'ch' || two === 'll' || two === 'rr') { out.push({ t: two, v: false }); i++; continue; }
      if ((c === 'q' || c === 'g') && n === 'u' && FRONT.includes(w[i + 2] || '')) { out.push({ t: two, v: false }); i++; continue; }
      if (c === 'y') {
        // "y" is a vowel at the end of a word (hoy, muy, y) or before a consonant
        const vowel = i === w.length - 1 || !(isV(n) || n === 'y');
        out.push({ t: 'y', v: vowel, y: vowel });
        continue;
      }
      out.push({ t: c, v: isV(c) });
    }
    return out;
  }

  // Units -> syllables (arrays of unit indexes)
  function syllabify(u) {
    // vowel groups -> nuclei (two strong vowels are split: hiatus)
    const seg = []; // { kind: 'C', i } or { kind: 'N', is: [..] }
    u.forEach((x, i) => {
      if (!x.v) { seg.push({ kind: 'C', i }); return; }
      const last = seg[seg.length - 1];
      if (last && last.kind === 'N') {
        const prev = u[last.is[last.is.length - 1]].t;
        if (!(strong(prev) && strong(x.t))) { last.is.push(i); return; }
      }
      seg.push({ kind: 'N', is: [i] });
    });
    const nuclei = seg.map((s, k) => (s.kind === 'N' ? k : -1)).filter((k) => k >= 0);
    if (!nuclei.length) return [u.map((x, i) => i)];
    const syl = nuclei.map(() => []);
    // consonants before the first nucleus
    for (let k = 0; k < nuclei[0]; k++) syl[0].push(seg[k].i);
    nuclei.forEach((nk, n) => {
      syl[n].push(...seg[nk].is);
      const nextK = nuclei[n + 1];
      const cons = [];
      for (let k = nk + 1; k < (nextK === undefined ? seg.length : nextK); k++) cons.push(seg[k].i);
      if (nextK === undefined) { syl[n].push(...cons); return; }
      const t = cons.map((i) => u[i].t);
      let keep; // how many consonants stay in this syllable
      if (cons.length <= 1) keep = 0;
      else if (cons.length === 2) keep = ONSET2.has(t[0] + t[1]) ? 0 : 1;
      else if (cons.length === 3) keep = ONSET2.has(t[1] + t[2]) ? 1 : 2;
      else keep = cons.length - 2;
      syl[n].push(...cons.slice(0, keep));
      syl[n + 1].push(...cons.slice(keep));
    });
    return syl;
  }

  function stressIndex(w, u, syl) {
    if (syl.length === 1) return 0;
    for (let s = 0; s < syl.length; s++) if (syl[s].some((i) => ACC.includes(u[i].t))) return s;
    const last = w[w.length - 1];
    return 'aeiouns'.includes(last) ? syl.length - 2 : syl.length - 1;
  }

  // Sound of each unit (Castilian), with the usual soft b/d/g and the n, s changes.
  function sounds(u, syl) {
    const nucleusOf = {};
    syl.forEach((s) => { const vs = s.filter((i) => u[i].v); vs.forEach((i) => { nucleusOf[i] = vs; }); });
    const base = u.map((x, i) => {
      const prev = u[i - 1], next = u[i + 1];
      const pt = prev ? prev.t : '';
      const start = i === 0;
      switch (x.t) {
        case 'a': case 'á': return 'a';
        case 'e': case 'é': return 'e';
        case 'o': case 'ó': return 'o';
        case 'í': return 'i';
        case 'ú': return 'u';
        case 'i': case 'u': case 'ü': case 'y': {
          if (!x.v) return 'ʝ'; // consonant y
          const nuc = nucleusOf[i] || [i];
          if (nuc.length === 1) return x.t === 'u' || x.t === 'ü' ? 'u' : 'i';
          const pos = nuc.indexOf(i);
          const hasStrongAfter = nuc.slice(pos + 1).some((j) => strong(u[j].t));
          const hasStrongBefore = nuc.slice(0, pos).some((j) => strong(u[j].t));
          const isU = x.t === 'u' || x.t === 'ü';
          if (!hasStrongAfter && !hasStrongBefore) {
            // weak + weak (ui, iu): the second one carries the syllable, except a final -y (muy, fui-y): it closes it
            const lastIsY = u[nuc[nuc.length - 1]].y;
            if (lastIsY) return pos === nuc.length - 1 ? 'i̯' : (isU ? 'u' : 'i');
            return pos === nuc.length - 1 ? (isU ? 'u' : 'i') : (isU ? 'w' : 'j');
          }
          return hasStrongAfter ? (isU ? 'w' : 'j') : (isU ? 'u̯' : 'i̯');
        }
        case 'b': case 'v': case 'w': if (x.t === 'w') return 'w'; return start || 'mn'.includes(pt) ? 'b' : 'β';
        case 'd': return start || 'nl'.includes(pt) ? 'd' : 'ð';
        case 'g': if (next && FRONT.includes(next.t)) return 'x'; return start || pt === 'n' ? 'ɡ' : 'ɣ';
        case 'gu': return start || pt === 'n' ? 'ɡ' : 'ɣ';
        case 'j': return 'x';
        case 'c': return next && FRONT.includes(next.t) ? 'θ' : 'k';
        case 'qu': case 'k': return 'k';
        case 'z': return 'θ';
        case 'ch': return 'tʃ';
        case 'll': return 'ʝ';
        case 'ñ': return 'ɲ';
        case 'h': return '';
        case 'rr': return 'r';
        case 'r': return start || 'nls'.includes(pt) ? 'r' : 'ɾ';
        case 'x': return 'ks';
        default: return x.t;
      }
    });
    // n and s take on something of the next sound
    return base.map((s, i) => {
      const nx = base.slice(i + 1).find((v) => v !== '') || '';
      if (s === 'n') { if (/^[bβpm]/.test(nx)) return 'm'; if (/^[kɡɣx]/.test(nx)) return 'ŋ'; }
      if (s === 's' && /^[bβdðɡɣmnlrɾʝ]/.test(nx)) return 'z';
      // after a nasal, b/d/g are hard (un vaso, un gato)
      return s;
    });
  }

  const cache = new Map();
  // One word -> syllables [{ text, ipa, stress }]; stress 1 = main stress.
  function syllables(word) {
    const w = lower(word);
    if (!w) return [];
    if (cache.has(w)) return cache.get(w);
    const u = units(w);
    const syl = syllabify(u);
    const st = stressIndex(w, u, syl);
    const snd = sounds(u, syl);
    const out = syl.map((s, k) => ({ text: s.map((i) => u[i].t).join(''), ipa: s.map((i) => snd[i]).join(''), stress: k === st ? 1 : 0 }));
    cache.set(w, out);
    return out;
  }
  const ipa = (word) => { const s = syllables(word); return s.map((x) => (s.length > 1 && x.stress ? 'ˈ' : '') + x.ipa).join(''); };
  // Same key = sounds the same (soft/hard b d g, n and s changes ignored)
  const key = (word) => syllables(word).map((x) => x.ipa).join('')
    .replace(/β/g, 'b').replace(/ð/g, 'd').replace(/ɣ/g, 'ɡ').replace(/z/g, 's').replace(/[ŋm](?=[^aeiou])/g, 'n').replace(/i̯/g, 'i').replace(/u̯/g, 'u');

  // ---- tips in English (HTML) ----
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const b = (w) => `<b>${esc(w)}</b>`;
  const coreWord = (w) => String(w).toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const endsVowel = (w) => /[aeiouáéíóúy]$/.test(w);
  // starts with a vowel sound (a silent h does not count; hie-/hue- start with a y/w sound)
  const startsVowel = (w) => { const s = w.replace(/^h/, ''); return /^[aeiouáéíóú]/.test(s) && !/^[iu][aeiouáéíóú]/.test(s); };

  // Linking between words: vowel + vowel melt into one beat (sinalefa); consonant + vowel join (enlace).
  function linkNotes(text) {
    const ws = String(text).split(/\s+/).map(coreWord).filter(Boolean);
    const melt = [], join = [];
    for (let i = 0; i < ws.length - 1; i++) {
      const a = ws[i], c = ws[i + 1];
      if (!startsVowel(c)) continue;
      if (endsVowel(a) && melt.length < 3) melt.push(`${b(a + '‿' + c)}`);
      else if (/[bcdfgjklmnpqrstvxzñ]$/.test(a) && join.length < 3) {
        const sound = c.replace(/^h/, '');
        join.push(`${b(a + '‿' + c)} → <span class="say">“${esc(a.slice(0, -1) + '-' + a.slice(-1) + sound)}”</span>`);
      }
    }
    const out = [];
    if (melt.length) out.push(`Join the vowels of the two words into one beat (sinalefa): ${melt.join(', ')}.`);
    if (join.length) out.push(`Link the last consonant to the next word: ${join.join(', ')}.`);
    return out;
  }

  // Letters that sound different from English, with examples from these words.
  function soundTips(words, max = 3) {
    const ws = [...new Set(words.map(coreWord).filter((w) => w.length > 1))];
    const pick = (re) => ws.filter((w) => re.test(w)).slice(0, 2);
    const tips = [];
    const add = (list, text) => { if (list.length && tips.length < max) tips.push(text(list.map(b).join(', '))); };
    add(pick(/z|c[eéiíy]/), (ex) => `In Spain, <b>z</b> and <b>c</b> before e/i sound like the <b>th</b> in “think”: ${ex}.`);
    add(pick(/j|g[eéiíy]/), (ex) => `<b>j</b> and <b>g</b> before e/i are a strong <b>h</b> from the back of the throat: ${ex}.`);
    add(pick(/rr|^r|[nls]r/), (ex) => `<b>rr</b>, and <b>r</b> at the start of a word, are rolled (trilled): ${ex}.`);
    add(pick(/[aeiouáéíóú]d[aeiouáéíóú]|d$/), (ex) => `<b>d</b> between vowels and at the end is soft, like the <b>th</b> in “this”: ${ex}.`);
    add(pick(/v/), (ex) => `<b>v</b> sounds the same as <b>b</b>: ${ex}.`);
    add(pick(/^h/), (ex) => `<b>h</b> is silent: ${ex}.`);
    add(pick(/ll|y[aeiouáéíóú]/), (ex) => `<b>ll</b> and <b>y</b> sound like the <b>y</b> in “yes”: ${ex}.`);
    add(pick(/ñ/), (ex) => `<b>ñ</b> sounds like the <b>ny</b> in “canyon”: ${ex}.`);
    return tips;
  }

  window.ES_PRON = { syllables, ipa, key, linkNotes, soundTips, lower };
})();
