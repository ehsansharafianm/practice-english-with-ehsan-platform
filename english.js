/* American English pronunciation lookup — Practice with Ehsan
 * Uses the CMU Pronouncing Dictionary files of the Pronunciation page (pronunciation/data/<letter>.txt).
 *   await EN_PRON.lookup('pronunciation') ->
 *     { ipa: 'pɹəˌnʌnsiˈeɪʃən', syllables: [{ text: 'pruh', ipa: 'prə', stress: 0 }, …] }   or null when unknown
 * text is a "sounds like" spelling for learners; the stressed syllable has stress 1.
 */
(function () {
  'use strict';
  const base = (document.currentScript && document.currentScript.src || '').replace(/english\.js(\?.*)?$/, '');
  const shards = {};
  function shard(ch) {
    const k = ch >= 'a' && ch <= 'z' ? ch : '0';
    if (!shards[k]) {
      shards[k] = fetch(base + 'pronunciation/data/' + k + '.txt').then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }).then((t) => {
        const m = new Map();
        t.split('\n').forEach((line) => { const i = line.indexOf('\t'); if (i > 0) m.set(line.slice(0, i), line.slice(i + 1).split(';')); });
        return m;
      }).catch((e) => { delete shards[k]; throw e; });
    }
    return shards[k];
  }
  const IPA = { AA: 'ɑ', AE: 'æ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', EH: 'ɛ', EY: 'eɪ', IH: 'ɪ', IY: 'i', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'u',
    B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'g', HH: 'h', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'r',
    S: 's', SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ' };
  function ipaPhone(p) {
    const b = p.replace(/\d/, ''), s = p.slice(-1);
    if (b === 'AH') return s === '0' ? 'ə' : 'ʌ';
    if (b === 'ER') return s === '0' ? 'ɚ' : 'ɝ';
    return IPA[b] || '';
  }
  const RES = { B: 'b', CH: 'ch', D: 'd', DH: 'dh', F: 'f', G: 'g', HH: 'h', JH: 'j', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ng', P: 'p',
    R: 'r', S: 's', SH: 'sh', T: 't', TH: 'th', V: 'v', W: 'w', Y: 'y', Z: 'z', ZH: 'zh' };
  function respell(phones) {
    const vi = phones.findIndex((p) => /\d$/.test(p));
    const onset = vi > 0, coda = vi >= 0 && vi < phones.length - 1;
    return phones.map((p, i) => {
      if (i !== vi) return RES[p] || '';
      switch (p.replace(/\d/, '')) {
        case 'AA': return 'ah'; case 'AE': return 'a'; case 'AO': return 'aw'; case 'AW': return 'ow';
        case 'AY': return !onset ? 'eye' : coda ? 'igh' : 'y';
        case 'EH': return coda ? 'e' : 'eh'; case 'IH': return coda ? 'i' : 'ih';
        case 'EY': return 'ay'; case 'IY': return 'ee'; case 'OW': return 'oh'; case 'OY': return 'oy';
        case 'UH': return 'uu'; case 'UW': return 'oo'; case 'ER': return 'ur';
        case 'AH': return p.endsWith('0') || !coda ? 'uh' : 'u';
        default: return '';
      }
    }).join('');
  }
  async function word(w) {
    w = String(w || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z']/g, '');
    if (!w) return null;
    const m = await shard(w[0]);
    const raw = m.get(w) || m.get(w.replace(/'/g, ''));
    if (!raw) return null;
    const syl = raw[0].split('.').map((s) => {
      const phones = s.split(' ');
      const v = phones.find((p) => /\d$/.test(p)) || '';
      return { phones, stress: v ? +v.slice(-1) : 0 };
    });
    return syl.map((s) => ({ text: respell(s.phones), ipa: s.phones.map(ipaPhone).join(''), stress: s.stress === 1 ? 1 : 0, second: s.stress === 2 }));
  }
  // A word or a short phrase -> { ipa, syllables (of all the words, with { gap: true } between words) } or null if a word is unknown
  async function lookup(text) {
    const words = String(text || '').split(/\s+/).filter(Boolean).slice(0, 6);
    if (!words.length) return null;
    const per = await Promise.all(words.map((x) => word(x).catch(() => null)));
    if (per.some((x) => !x)) return null;
    const ipa = per.map((sy) => sy.map((s) => (sy.length > 1 && s.stress ? 'ˈ' : sy.length > 1 && s.second ? 'ˌ' : '') + s.ipa).join('')).join(' ');
    const syllables = [];
    per.forEach((sy, i) => { if (i) syllables.push({ gap: true }); sy.forEach((s) => syllables.push(sy.length > 1 ? s : { ...s, stress: 0 })); });
    return { ipa, syllables };
  }
  window.EN_PRON = { lookup };
})();
