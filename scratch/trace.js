const aggressiveNormalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const tqc = aggressiveNormalize("12th Pass");
const programMap = {
  "12th Pass": {
    "Trending Programs": [
      "B.Sc IT (Cyber Security)",
      "AI & ML",
      "Cloud Automation",
      "Animation, VFX & Game Design"
    ],
    "Traditional Programs": [
      "BBA",
      "B.Com",
      "BCA",
      "B.Sc"
    ]
  }
};

let qm = {};
const qk = Object.keys(programMap).find(k => aggressiveNormalize(k) === tqc || (tqc && aggressiveNormalize(k).includes(tqc)));
qm = qk ? programMap[qk] : {};

if (Array.isArray(qm)) qm = { "Programs": qm };
const categories = Object.keys(qm);

const messageText = "Trending Programs";
const replyValue = "list_0";
let val = (replyValue && !replyValue.startsWith('list_') ? replyValue : messageText || '').trim();
const nv = aggressiveNormalize(val);

const matchedCategory = categories.find(c => aggressiveNormalize(c) === nv || aggressiveNormalize(c).includes(nv));

console.log("tqc:", tqc);
console.log("qk:", qk);
console.log("categories:", categories);
console.log("val:", val);
console.log("nv:", nv);
console.log("matchedCategory:", matchedCategory);
