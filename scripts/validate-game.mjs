// Проверка src/data/defaultGame.json: структура, уникальность id, флаги.
import fs from 'node:fs';

const file = process.argv[2] ?? new URL('../src/data/defaultGame.json', import.meta.url);
const g = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const ids = new Set();
const levelIds = g.levels.map((l) => l.id);
let total = 0, cats = 0, auctions = 0, placeholders = 0;

for (const c of g.categories) {
  if (!c.title?.trim()) errors.push(`Категория ${c.id} без названия`);
  for (const lid of levelIds) {
    const cell = c.cells[lid];
    if (!cell?.length) { errors.push(`Пустая клетка ${c.title} / ${lid}`); continue; }
    if (cell.filter((q) => q.catInBag || q.auction).length > 1) errors.push(`В клетке ${c.title} / ${lid} больше одного спецвопроса`);
    for (const q of cell) {
      total++;
      if (ids.has(q.id)) errors.push(`Повтор id ${q.id}`);
      ids.add(q.id);
      if (!q.text?.trim() || !q.answer?.trim()) errors.push(`Вопрос ${q.id} без текста или ответа`);
      if (q.catInBag) cats++;
      if (q.auction) auctions++;
      if (q.isPlaceholder) placeholders++;
      if (q.catInBag && q.auction) errors.push(`Вопрос ${q.id} одновременно кот в мешке и аукцион`);
    }
  }
}
if (cats < 5 || cats > 8) errors.push(`Котов в мешке ${cats}, нужно 5–8`);
if (auctions < 2 || auctions > 3) errors.push(`Аукционов ${auctions}, нужно 2–3`);

console.log(`Вопросов: ${total}, котов в мешке: ${cats}, аукционов: ${auctions}, плейсхолдеров: ${placeholders}`);
if (errors.length) {
  console.error('Ошибки:\n' + errors.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('defaultGame.json в порядке ✓');
