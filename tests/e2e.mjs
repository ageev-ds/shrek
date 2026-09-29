// Сквозной тест: запускает собранное приложение в Electron через Playwright и проходит все сценарии.
// Запуск: npm run test:e2e  (на Linux без дисплея — через xvfb-run)
import { _electron as electron } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const tmp = path.join(root, 'tests', '.tmp');
const userData = path.join(tmp, 'userData');
const shots = path.join(tmp, 'shots');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(shots, { recursive: true });

const errors = [];
let step = 0;

async function launch() {
  const app = await electron.launch({
    args: [root, '--no-sandbox'],
    env: { ...process.env, SHREK_USER_DATA: userData, SHREK_WINDOWED: '1' },
  });
  const page = await app.firstWindow();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1920, 1080));
  await page.waitForSelector('[data-testid="btn-play"]', { timeout: 20000 });
  return { app, page };
}

const shot = (page, name) => page.screenshot({ path: path.join(shots, `${String(++step).padStart(2, '0')}-${name}.png`) });
const log = (m) => console.log(`✓ ${m}`);
const scoreOf = async (page, team) => Number((await page.locator(`[data-testid="score-${team}"] [data-testid="score-value"]`).innerText()).replace(/\s/g, ''));

// ---------- 1. первый запуск ----------
let { app, page } = await launch();
process.on('uncaughtException', async (e) => {
  console.error('ОШИБКА:', e.message.split('\n')[0]);
  console.error(errors.join('\n'));
  try {
    await page.screenshot({ path: path.join(shots, 'FAIL.png') });
  } catch {}
  process.exit(1);
});
assert.ok(fs.existsSync(path.join(userData, 'gameData.json')), 'gameData.json создан при первом запуске');
await page.waitForTimeout(2600);
await shot(page, 'start');
log('Стартовый экран');

// ---------- 2. команды ----------
await page.click('[data-testid="btn-play"]');
await page.waitForSelector('[data-testid="team-name"]');
assert.ok(await page.locator('[data-testid="btn-start-game"]').isDisabled(), 'Начать игру неактивна без команд');
for (const [name, av] of [
  ['Огры', 'shrek'],
  ['Ослы', 'donkey'],
  ['Коты', 'puss'],
]) {
  await page.fill('[data-testid="team-name"]', name);
  await page.click(`[data-testid="avatar-${av}"]`);
  await page.click('[data-testid="btn-add-team"]');
}
await page.waitForTimeout(600);
assert.equal(await page.locator('[data-testid="team-card"]').count(), 3);
await shot(page, 'teams');
await page.click('[data-testid="btn-start-game"]');
await page.waitForSelector('[data-testid="board-grid"]');
await page.waitForTimeout(1800);
await shot(page, 'board');
log('Команды добавлены, поле открыто');

// ---------- 3. обычный вопрос: верно ----------
const normalCell = page.locator('.board-cell:not(.cat):not(.auction):not(.played)').first();
await normalCell.click();
await page.waitForSelector('[data-testid="q-text"]');
await page.waitForTimeout(900);
await shot(page, 'question');
const value1 = Number(await page.locator('[data-testid="q-value"]').innerText());
await page.click('[data-testid="btn-correct"]');
await page.waitForSelector('[data-testid="q-answer"]');
await page.waitForTimeout(700);
await shot(page, 'question-correct');
await page.click('[data-testid="btn-to-board"]');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });
assert.equal(await scoreOf(page, 'Огры'), value1, 'очки начислены');
assert.equal(await page.locator('.board-cell.played').count(), 1);
log(`Верный ответ: +${value1}`);

// ---------- 4. неверно → передача хода → отмена ----------
await page.locator('.board-cell:not(.cat):not(.auction):not(.played)').nth(3).click();
await page.waitForSelector('[data-testid="btn-wrong"]');
const value2 = Number(await page.locator('[data-testid="q-value"]').innerText());
await page.click('[data-testid="btn-wrong"]');
await page.waitForSelector('[data-testid="next-Ослы"]');
await shot(page, 'question-wrong');
await page.click('[data-testid="next-Ослы"]');
await page.click('[data-testid="btn-correct"]');
await page.click('[data-testid="btn-to-board"]');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });
assert.equal(await scoreOf(page, 'Огры'), value1 - value2, 'штраф за неверный');
assert.equal(await scoreOf(page, 'Ослы'), value2, 'вторая команда получила очки');
log('Неверный ответ и передача хода');

await page.locator('.board-cell:not(.cat):not(.auction):not(.played)').first().click();
await page.waitForSelector('[data-testid="btn-cancel"]');
await page.keyboard.press('Space');
await page.waitForSelector('[data-testid="q-answer"]');
await page.click('[data-testid="btn-to-board"]');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });
assert.equal(await page.locator('.board-cell.played').count(), 3);
await page.locator('.board-cell:not(.cat):not(.auction):not(.played)').first().click();
await page.waitForSelector('[data-testid="btn-cancel"]');
await page.keyboard.press('Escape');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });
assert.equal(await page.locator('.board-cell.played').count(), 3, 'Esc не засчитывает клетку');
log('Пробел показывает ответ, Esc отменяет');

// ---------- 5. кот в мешке ----------
const catCount = await page.locator('.board-cell.cat').count();
assert.ok(catCount >= 5, `на поле ${catCount} котов в мешке`);
await page.locator('.board-cell.cat').first().click();
await page.waitForSelector('[data-testid="cat-modal"]');
await page.waitForTimeout(1900);
await shot(page, 'cat-in-bag');
const activeBefore = await page.locator('.score-card.active [class="score-name"]').innerText();
const target = activeBefore === 'Коты' ? 'Огры' : 'Коты';
await page.click(`[data-testid="cat-pick-${target}"]`);
await page.waitForSelector('[data-testid="q-answering"]');
assert.match(await page.locator('[data-testid="q-answering"]').innerText(), new RegExp(target));
await page.waitForTimeout(700);
await shot(page, 'cat-question');
const catValue = Number(await page.locator('[data-testid="q-value"]').innerText());
const before = await scoreOf(page, target);
await page.click('[data-testid="btn-correct"]');
await page.click('[data-testid="btn-to-board"]');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });
assert.equal(await scoreOf(page, target), before + catValue);
log(`Кот в мешке: вопрос отдан команде «${target}», +${catValue}`);

// ---------- 6. аукцион ----------
assert.ok((await page.locator('.board-cell.auction').count()) >= 2);
await page.locator('.board-cell.auction').first().click();
await page.waitForSelector('[data-testid="auction-modal"]');
await page.click('[data-testid="pass-Ослы"]'); // Ослы вступают в торг
const maxBid = Math.max(await scoreOf(page, 'Ослы'), 0);
await page.fill('[data-testid="bid-Ослы"]', String(maxBid + 100000));
await page.locator('[data-testid="bid-Ослы"]').blur();
await page.waitForTimeout(500);
await shot(page, 'auction');
await page.click('[data-testid="auction-done"]');
await page.waitForSelector('[data-testid="q-answering"]');
const auctionValue = Number(await page.locator('[data-testid="q-value"]').innerText());
assert.ok(auctionValue >= 100, 'ставка аукциона не меньше номинала');
assert.ok(auctionValue <= Math.max(maxBid, 500), 'ставка не больше счёта/номинала');
await page.click('[data-testid="btn-wrong"]');
await page.waitForSelector('[data-testid="btn-reveal"]');
await page.click('[data-testid="btn-reveal"]');
await page.click('[data-testid="btn-to-board"]');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });
log(`Аукцион: ставка ${auctionValue}`);

// ---------- 7. таймер ----------
await page.evaluate(() => {
  // ускоряем время для проверки авто-раскрытия ответа
  const orig = performance.now.bind(performance);
  const start = orig();
  window.__restoreNow = () => (performance.now = orig);
  performance.now = () => start + (orig() - start) * 40;
});
await page.locator('.board-cell:not(.cat):not(.auction):not(.played)').first().click();
await page.waitForSelector('[data-testid="q-answer"]', { timeout: 8000 });
await page.evaluate(() => window.__restoreNow());
log('Таймер истёк — ответ раскрылся автоматически');
await page.click('[data-testid="btn-to-board"]');
await page.waitForSelector('[data-testid="question-screen"]', { state: 'detached' });

// ---------- 8. сохранение партии и продолжение ----------
await page.waitForTimeout(600);
assert.ok(fs.existsSync(path.join(userData, 'session.json')), 'партия сохранена');
const playedCount = await page.locator('.board-cell.played').count();

// ---------- 9. финал ----------
await page.click('[data-testid="btn-finish"]');
await page.getByRole('button', { name: 'К награждению' }).click();
await page.waitForSelector('[data-testid="finale"]');
await page.waitForTimeout(4200);
await shot(page, 'finale');
await page.click('[data-testid="btn-stats"]');
await page.waitForSelector('[data-testid="stats-modal"]');
await page.waitForTimeout(900);
await shot(page, 'stats');
await page.keyboard.press('Escape');
await page.click('[data-testid="btn-replay"]');
await page.waitForSelector('[data-testid="board-grid"]');
await page.waitForTimeout(800);
assert.equal(await page.locator('.board-cell.played').count(), 0, 'поле сброшено');
assert.equal(await scoreOf(page, 'Огры'), 0, 'счёт сброшен');
assert.equal(await page.locator('.score-card').count(), 3, 'команды сохранены');
log(`Финал, статистика и «Сыграть ещё раз» (до этого сыграно ${playedCount})`);

// ---------- 10. режим разработчика ----------
await page.click('text=☰ Меню');
await page.getByRole('button', { name: 'В меню' }).click();
await page.waitForSelector('[data-testid="btn-dev"]');
await page.keyboard.press('Control+Shift+D');
await page.waitForSelector('[data-testid="dev-mode"]');
await page.waitForTimeout(500);
await shot(page, 'dev-questions');

// заменить плейсхолдер
await page.click('[data-testid="filter-placeholder"]');
await page.locator('.q-filter-list .q-variant').first().click();
await page.waitForSelector('[data-testid="placeholder-banner"]');
await shot(page, 'dev-placeholder');
await page.fill('[data-testid="q-text-input"]', 'Как зовут именинницу? (тест)');
await page.fill('[data-testid="q-answer-input"]', 'Фиона');
await page.waitForSelector('[data-testid="placeholder-banner"]', { state: 'detached' });
await page.click('[data-testid="flag-noRisk"]');
// загрузить картинку
const png = path.join(tmp, 'pic.png');
fs.writeFileSync(
  png,
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
);
await page.setInputFiles('[data-testid="q-image-file"]', png);
await page.waitForSelector('.q-image-preview img');
log('Плейсхолдер заменён, картинка загружена');

// добавить уровень и категорию
await page.click('[data-testid="filter-placeholder"]');
const levelsBefore = await page.locator('[data-testid="level-row"]').count();
await page.click('[data-testid="btn-add-level"]');
assert.equal(await page.locator('[data-testid="level-row"]').count(), levelsBefore + 1);
await page.click('[data-testid="nav-categories"]');
await page.waitForSelector('[data-testid="category-row"]');
const catsBefore = await page.locator('[data-testid="category-row"]').count();
await page.click('[data-testid="btn-add-category"]');
assert.equal(await page.locator('[data-testid="category-row"]').count(), catsBefore + 1);
await page.locator('[data-testid="category-title"]').last().fill('Моя категория');
await shot(page, 'dev-categories');
// настройки
await page.click('[data-testid="nav-settings"]');
await page.fill('[data-testid="set-title"]', 'СВОЯ ИГРА: ТЕСТ');
await page.fill('[data-testid="set-defaultTimerSec"]', '45');
await shot(page, 'dev-settings');
await page.click('[data-testid="nav-backgrounds"]');
await page.waitForTimeout(400);
await shot(page, 'dev-backgrounds');
await page.waitForSelector('[data-testid="saved-badge"]:has-text("Сохранено")', { timeout: 5000 });
log('Уровень, категория и настройки изменены, сохранено');

// экспорт (подменяем системный диалог)
const exportPath = path.join(tmp, 'export.json');
await app.evaluate(({ dialog }, p) => {
  dialog.showSaveDialog = async () => ({ canceled: false, filePath: p });
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] });
}, exportPath);
await page.click('[data-testid="btn-export-game"]');
await page.waitForSelector('[data-testid="toast"]');
const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
assert.equal(exported.format, 'shrek-jeopardy');
assert.equal(exported.game.meta.title, 'СВОЯ ИГРА: ТЕСТ');
assert.ok(JSON.stringify(exported).includes('data:image/webp;base64'), 'картинка встроена в экспорт');
log('Экспорт в .json с картинками');

await app.close();

// ---------- 11. перезапуск: всё сохранилось ----------
({ app, page } = await launch());
const saved = JSON.parse(fs.readFileSync(path.join(userData, 'gameData.json'), 'utf8'));
assert.equal(saved.meta.title, 'СВОЯ ИГРА: ТЕСТ');
assert.equal(saved.settings.defaultTimerSec, 45);
assert.equal(saved.levels.length, levelsBefore + 1);
assert.ok(saved.categories.some((c) => c.title === 'Моя категория'));
const bday = saved.categories.find((c) => c.title === 'Про именинницу');
const edited = Object.values(bday.cells).flat().find((q) => q.text === 'Как зовут именинницу? (тест)');
assert.ok(edited && !edited.isPlaceholder && edited.noRisk && edited.image?.startsWith('asset://local/'));
assert.ok(fs.existsSync(path.join(userData, 'assets', edited.image.slice('asset://local/'.length))), 'файл картинки на месте');
await page.waitForTimeout(2600);
assert.match(await page.locator('.logo h1').getAttribute('aria-label'), /ТЕСТ/);
log('После перезапуска все правки на месте');

// предпросмотр в игре: видна загруженная картинка
await page.click('[data-testid="btn-dev"]');
await page.waitForSelector('[data-testid="dev-mode"]');
await page.click('[data-testid="btn-preview"]');
await page.waitForSelector('[data-testid="btn-start-game"]');
await page.click('[data-testid="btn-start-game"]');
await page.waitForSelector('[data-testid="board-grid"]');
const bdayIndex = saved.categories.findIndex((c) => c.title === 'Про именинницу');
await page.click(`[data-testid="cell-${bdayIndex}-0"]`);
await page.waitForSelector('[data-testid="q-text"]');
assert.match(await page.locator('[data-testid="q-text"]').innerText(), /тест/);
const imgOk = await page.locator('.q-image img').evaluate((img) => img.complete && img.naturalWidth > 0);
assert.ok(imgOk, 'картинка из userData/assets отображается');
await page.waitForTimeout(800);
await shot(page, 'preview-question');
await page.keyboard.press('Escape');
await page.click('[data-testid="btn-exit-preview"]');
await page.waitForSelector('[data-testid="dev-mode"]');
log('Предпросмотр и возврат в редактор');

// импорт + сброс
await app.evaluate(({ dialog }, p) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] });
}, exportPath);
await page.click('[data-testid="nav-settings"]');
await page.click('[data-testid="btn-reset-all"]');
await page.getByRole('button', { name: 'Да, сбросить' }).click();
await page.getByRole('button', { name: 'Сбросить к дефолту' }).click();
await page.waitForSelector('[data-testid="toast"]:has-text("сброшена")');
assert.equal(JSON.parse(fs.readFileSync(path.join(userData, 'gameData.json'), 'utf8')).meta.title, 'СВОЯ ИГРА: ШРЕК');
await page.click('[data-testid="btn-import-game"]');
await page.getByRole('button', { name: 'Выбрать файл…' }).click();
await page.waitForSelector('[data-testid="toast"]:has-text("импортирована")');
await page.waitForTimeout(800);
const reimported = JSON.parse(fs.readFileSync(path.join(userData, 'gameData.json'), 'utf8'));
assert.equal(reimported.meta.title, 'СВОЯ ИГРА: ТЕСТ');
const reImg = Object.values(reimported.categories.find((c) => c.title === 'Про именинницу').cells).flat().find((q) => q.image?.startsWith('asset://'));
assert.ok(reImg && fs.existsSync(path.join(userData, 'assets', reImg.image.slice('asset://local/'.length))), 'картинка распакована при импорте');
log('Сброс к дефолту и импорт из .json');

// пароль
await page.fill('[data-testid="set-password"]', 'fiona');
await page.waitForSelector('[data-testid="saved-badge"]:has-text("Сохранено")');
await app.close();
({ app, page } = await launch());
await page.keyboard.press('Control+Shift+D');
await page.waitForSelector('[data-testid="dev-password"]');
await page.fill('[data-testid="dev-password"]', 'nope');
await page.keyboard.press('Enter');
await page.waitForSelector('text=Неверный пароль');
await page.fill('[data-testid="dev-password"]', 'fiona');
await page.keyboard.press('Enter');
await page.waitForSelector('[data-testid="dev-mode"]');
log('Пароль на режим разработчика');

// логи
assert.ok(fs.existsSync(path.join(userData, 'logs', 'main.log')), 'лог пишется');
await app.close();

const relevant = errors.filter((e) => !/Autofill|DevTools/.test(e));
if (relevant.length) {
  console.error('Ошибки в консоли renderer:\n' + relevant.join('\n'));
  process.exit(1);
}
console.log(`\nВсе сценарии пройдены. Скриншоты: ${shots}`);
