import { useRef, useState } from 'react';
import { ConfirmDialog, Modal } from '../../components/ui';
import { ArtMedallion, ILLUSTRATION_IDS, ILLUSTRATIONS, QuestionImage } from '../../components/art';
import { useContent, useGame } from '../../store/content';
import { play } from '../../audio/sounds';
import { uid } from '../../lib/ids';
import { uploadImage } from '../../lib/assets';
import type { Question } from '../../types/game';
import { toast } from './toast';

interface Sel {
  categoryId: string;
  levelId: string;
  questionId: string;
}

export function QuestionForm({ sel, onDeleted, onSelect }: { sel: Sel; onDeleted: () => void; onSelect: (id: string) => void }) {
  const game = useGame();
  const update = useContent((s) => s.update);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [builtinOpen, setBuiltinOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const category = game.categories.find((c) => c.id === sel.categoryId);
  const level = game.levels.find((l) => l.id === sel.levelId);
  const cell = category?.cells[sel.levelId] ?? [];
  const q = cell.find((x) => x.id === sel.questionId);
  if (!category || !level || !q) return null;

  const set = (patch: Partial<Question>, clearPlaceholder = false) =>
    update((g) => {
      const target = g.categories.find((c) => c.id === sel.categoryId)?.cells[sel.levelId]?.find((x) => x.id === sel.questionId);
      if (!target) return;
      Object.assign(target, patch);
      for (const [k, v] of Object.entries(patch)) if (v === undefined) delete (target as unknown as Record<string, unknown>)[k];
      if (clearPlaceholder && target.isPlaceholder) {
        delete target.isPlaceholder;
        if (target.note?.startsWith('⚠ ЗАМЕНИ МЕНЯ')) delete target.note;
      }
    });

  const value = q.valueOverride ?? level.value;
  const defaultTimer = q.catInBag ? game.settings.catInBagTimerSec : q.auction ? game.settings.auctionTimerSec : game.settings.defaultTimerSec;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await uploadImage(file, 1600);
      set({ image: url });
      play('add');
    } catch (e) {
      toast(`Не удалось загрузить картинку: ${String(e)}`, 'error');
    }
  };

  const duplicate = () => {
    const id = uid('q');
    update((g) => {
      const c = g.categories.find((x) => x.id === sel.categoryId)!;
      const list = c.cells[sel.levelId];
      const idx = list.findIndex((x) => x.id === sel.questionId);
      list.splice(idx + 1, 0, { ...structuredClone(q), id });
    });
    play('add');
    onSelect(id);
  };

  const Flag = ({ k, label, hint }: { k: 'catInBag' | 'auction' | 'noRisk' | 'doubleStake'; label: string; hint: string }) => (
    <label className={`check ${q[k] ? 'on' : ''}`} title={hint}>
      <input
        type="checkbox"
        checked={!!q[k]}
        onChange={(e) => {
          const on = e.target.checked;
          const patch: Partial<Question> = { [k]: on || undefined };
          // Кот в мешке и аукцион взаимоисключающие
          if (on && k === 'catInBag') patch.auction = undefined;
          if (on && k === 'auction') {
            patch.catInBag = undefined;
            patch.doubleStake = undefined;
          }
          if (on && k === 'doubleStake') patch.catInBag = true;
          set(patch);
        }}
        data-testid={`flag-${k}`}
      />
      {label}
    </label>
  );

  return (
    <div className="q-form" data-testid="question-form">
      <div className="q-form-head">
        <div>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            {category.emoji} {category.title} · уровень {level.value} · вариант {cell.indexOf(q) + 1} из {cell.length}
          </div>
          {q.isPlaceholder && (
            <div className="placeholder-banner" data-testid="placeholder-banner">
              ⚠ <b>Замени меня!</b> Это заготовка. Впишите свой вопрос и ответ — метка снимется автоматически.
            </div>
          )}
          {q.verify && (
            <div className="verify-banner">
              🔍 Стоит перепроверить факт.{' '}
              <button className="linklike" onClick={() => set({ verify: undefined, note: q.note?.startsWith('verify') ? undefined : q.note })}>
                Факт проверен ✓
              </button>
            </div>
          )}
        </div>
        <div className="row">
          <button className="btn small wood-btn" onClick={duplicate} title="Дублировать вариант">
            ⧉ Копия
          </button>
          <button className="icon-btn danger" onClick={() => setConfirmDelete(true)} title="Удалить вопрос" data-testid="q-delete">
            🗑
          </button>
        </div>
      </div>

      <div className="q-form-grid">
        <label className="field">
          <span>Цена</span>
          <div className="stepper big">
            <button onClick={() => set({ valueOverride: Math.max(0, value - 50) })}>−</button>
            <input type="number" step={50} value={value} onChange={(e) => set({ valueOverride: Number(e.target.value) || 0 })} data-testid="q-price" />
            <button onClick={() => set({ valueOverride: value + 50 })}>+</button>
          </div>
          {q.valueOverride !== undefined && q.valueOverride !== level.value && (
            <button className="linklike" onClick={() => set({ valueOverride: undefined })}>
              ↺ как у уровня ({level.value})
            </button>
          )}
        </label>
        <label className="field">
          <span>Таймер, сек</span>
          <div className="stepper big">
            <button onClick={() => set({ timerSec: Math.max(5, (q.timerSec ?? defaultTimer) - 5) })}>−</button>
            <input
              type="number"
              min={5}
              placeholder={`${defaultTimer} (общий)`}
              value={q.timerSec ?? ''}
              onChange={(e) => set({ timerSec: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })}
              data-testid="q-timer"
            />
            <button onClick={() => set({ timerSec: (q.timerSec ?? defaultTimer) + 5 })}>+</button>
          </div>
          {q.timerSec !== undefined && (
            <button className="linklike" onClick={() => set({ timerSec: undefined })}>
              ↺ общий ({defaultTimer} с)
            </button>
          )}
        </label>
      </div>

      <label className="field">
        <span>Текст вопроса</span>
        <textarea className="textarea" rows={3} value={q.text} onChange={(e) => set({ text: e.target.value }, true)} placeholder="Например: Какого цвета Шрек?" data-testid="q-text-input" />
      </label>
      <label className="field">
        <span>Ответ</span>
        <textarea className="textarea" rows={2} value={q.answer} onChange={(e) => set({ answer: e.target.value }, true)} placeholder="Например: Зелёного" data-testid="q-answer-input" />
      </label>

      <div className="field">
        <span>Картинка к вопросу</span>
        <div className="q-image-row">
          <div className="q-image-preview">{q.image ? <QuestionImage src={q.image} size={120} /> : <span className="muted">нет</span>}</div>
          <div className="col" style={{ gap: '0.5rem' }}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => void onFile(e.target.files?.[0]).finally(() => (e.target.value = ''))} data-testid="q-image-file" />
            <button className="btn small" onClick={() => fileRef.current?.click()}>
              ⤓ Загрузить
            </button>
            <button className="btn small wood-btn" onClick={() => setBuiltinOpen(true)}>
              ✦ Встроенная иллюстрация
            </button>
            {q.image && (
              <button className="btn small red" onClick={() => set({ image: undefined })}>
                ✕ Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="field">
        <span>Тип вопроса</span>
        <div className="flag-grid">
          <Flag k="catInBag" label="🐱 Кот в мешке" hint="Активная команда отдаёт вопрос другой" />
          <Flag k="auction" label="🔨 Аукцион" hint="Команды торгуются за право ответа" />
          <Flag k="noRisk" label="🛡 Без риска" hint="За неверный ответ очки не снимаются" />
          <Flag k="doubleStake" label="×2 Ставка x2" hint="Цена «кота в мешке» удваивается" />
        </div>
      </div>

      <label className="field">
        <span>Заметка для себя (в игре не видна)</span>
        <input className="input" value={q.note ?? ''} onChange={(e) => set({ note: e.target.value || undefined })} placeholder="Например: источник факта" />
      </label>

      <ConfirmDialog
        open={confirmDelete}
        title="Удалить вопрос?"
        text={cell.length === 1 ? 'Это последний вопрос в клетке — клетка на поле станет пустой.' : 'Вариант будет удалён.'}
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          setConfirmDelete(false);
          play('remove');
          update((g) => {
            const c = g.categories.find((x) => x.id === sel.categoryId)!;
            c.cells[sel.levelId] = c.cells[sel.levelId].filter((x) => x.id !== sel.questionId);
          });
          onDeleted();
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <Modal open={builtinOpen} onClose={() => setBuiltinOpen(false)} width={760}>
        <div className="col">
          <h3 className="gold-text">Встроенные иллюстрации</h3>
          <div className="builtin-grid">
            {ILLUSTRATION_IDS.map((id) => (
              <button
                key={id}
                className={`builtin-cell ${q.image === `builtin:${id}` ? 'on' : ''}`}
                onClick={() => {
                  set({ image: `builtin:${id}` });
                  setBuiltinOpen(false);
                  play('click');
                }}
              >
                <ArtMedallion art={ILLUSTRATIONS[id]} size={90} />
                <span>{ILLUSTRATIONS[id].name}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
