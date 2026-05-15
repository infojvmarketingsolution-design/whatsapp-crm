const aggressiveNormalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const val = "Trending Programs";
const nv = aggressiveNormalize(val);
console.log("nv:", nv);

const categories = ["🚀 Trending Programs", "📘 Traditional Programs"];
const matchedCategory = categories.find(c => aggressiveNormalize(c) === nv || aggressiveNormalize(c).includes(nv));

console.log("matchedCategory:", matchedCategory);
