import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../components/ui';
import { useContent, useGame } from '../../store/content';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';
import { uid } from '../../lib/ids';
import type { Question } from '../../types/game';
import { QuestionForm } from './QuestionForm';

interface Sel {
  categoryId: string;
  levelId: string;
  questionId: string;
}

type Filter = 'none' | 'placeholder' | 'verify' | 'special';

export function QuestionFlags({ q }: { q: Question }) {
  return (
    <span className="q-flags">
      {q.isPlaceholder && (
        <span className="badge warn" title="Заготовка — замените своим вопросом">
          ⚠ Замени меня!
        </span>
      )}
      {q.verify && <span title="Стоит перепроверить факт">🔍</span>}
      {q.catInBag && <span title="Кот в мешке">🐱</span>}
      {q.auction && <span title="Аукцион">🔨</span>}
      {q.noRisk && <span title="Без риска">🛡</span>}
      {q.doubleStake && <span title="Ставка ×2">×2</span>}
      {q.image && <span title="С картинкой">🖼</span>}
      {q.timerSec && <span title={`Свой таймер: ${q.timerSec} с`}>⏱</span>}
    </span>
  );
}

export function QuestionsEditor() {
  const game = useGame();
  const update = useContent((s) => s.update);
  const devCategoryId = useUi((s) => s.devCategoryId);
  const setUi = useUi((s) => s.set);
  const [filter, setFilter] = useState<Filter>('none');
  const [sel, setSel] = useState<Sel | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);

  const catId = game.categories.some((c) => c.id === devCategoryId) ? devCategoryId! : game.categories[0]?.id;
  const category = game.categories.find((c) => c.id === catId);

  // Выбор по умолчанию — первый вопрос категории
  useEffect(() => {
    if (sel && game.categories.find((c) => c.id === sel.categoryId)?.cells[sel.levelId]?.some((q) => q.id === sel.questionId)) return;
    const firstLevel = game.levels.find((l) => category?.cells[l.id]?.length);
    const q = firstLevel && category?.cells[firstLevel.id][0];
    setSel(q && category && firstLevel ? { categoryId: category.id, levelId: firstLevel.id, questionId: q.id } : null);
  }, [catId, game, sel, category]);

  const filtered = useMemo(() => {
    if (filter === 'none') return [];
    const out: (Sel & { q: Question; catTitle: string; emoji: string; value: number })[] = [];
    for (const c of game.categories)
      for (const l of game.levels)
        for (const q of c.cells[l.id] ?? []) {
          const hit =
            filter === 'placeholder' ? q.isPlaceholder : filter === 'verify' ? q.verify : q.catInBag || q.auction || q.noRisk || q.doubleStake;
          if (hit) out.push({ categoryId: c.id, levelId: l.id, questionId: q.id, q, catTitle: c.title, emoji: c.emoji, value: l.value });
        }
    return out;
  }, [filter, game]);

  const all = game.categories.flatMap((c) => Object.values(c.cells).flat());
  const counts = {
    placeholder: all.filter((q) => q.isPlaceholder).length,
    verify: all.filter((q) => q.verify).length,
    special: all.filter((q) => q.catInBag || q.auction || q.noRisk || q.doubleStake).length,
  };

  const addVariant = (levelId: string) => {
    if (!category) return;
    play('add');
    const id = uid('q');
    update((g) => {
      const c = g.categories.find((x) => x.id === category.id)!;
      (c.cells[levelId] ??= []).push({ id, text: '', answer: '' });
    });
    setSel({ categoryId: category.id, levelId, questionId: id });
  };

  const addLevel = () => {
    play('add');
    const id = uid('l');
    update((g) => {
      const value = (g.levels.at(-1)?.value ?? 0) + 100;
      g.levels.push({ id, value });
      for (const c of g.categories) c.cells[id] = [{ id: uid('q'), text: `Новый вопрос на ${value}`, answer: 'Ответ', isPlaceholder: true }];
    });
  };

  const deleteLevel = (levelId: string) => {
    play('remove');
    update((g) => {
      g.levels = g.levels.filter((l) => l.id !== levelId);
      for (const c of g.categories) delete c.cells[levelId];
    });
  };

  return (
    <div className="dev-panel questions-editor">
      <div className="dev-panel-head">
        <div className="cat-chips">
          {game.categories.map((c) => (
            <button
              key={c.id}
              className={`cat-chip ${c.id === catId && filter === 'none' ? 'on' : ''}`}
              style={{ ['--cat' as string]: c.color }}
              onClick={() => {
                play('click');
                setFilter('none');
                setUi({ devCategoryId: c.id });
                setSel(null);
              }}
              data-testid={`cat-chip-${c.title}`}
            >
              {c.emoji} {c.title}
              {Object.values(c.cells).flat().some((q) => q.isPlaceholder) && <span className="dot-warn" />}
            </button>
          ))}
        </div>
        <div className="row filter-chips">
          <FilterChip on={filter === 'placeholder'} onClick={() => setFilter(filter === 'placeholder' ? 'none' : 'placeholder')} label={`⚠ Замени меня (${counts.placeholder})`} testId="filter-placeholder" />
          <FilterChip on={filter === 'verify'} onClick={() => setFilter(filter === 'verify' ? 'none' : 'verify')} label={`🔍 Проверить факты (${counts.verify})`} />
          <FilterChip on={filter === 'special'} onClick={() => setFilter(filter === 'special' ? 'none' : 'special')} label={`✨ Спецвопросы (${counts.special})`} />
        </div>
      </div>

      <div className="q-editor-split">
        <div className="q-matrix">
          {filter !== 'none' ? (
            <div className="q-filter-list">
              {filtered.length === 0 && <p className="muted">Ничего не найдено — всё в порядке! ✨</p>}
              {filtered.map((f) => (
                <button
                  key={f.questionId}
                  className={`q-variant ${sel?.questionId === f.questionId ? 'on' : ''}`}
                  onClick={() => {
                    play('click');
                    setSel(f);
                  }}
                >
                  <span className="q-variant-meta">
                    {f.emoji} {f.catTitle} · {f.value}
                  </span>
                  <span className="q-variant-text">{f.q.text || <i className="muted">(пустой вопрос)</i>}</span>
                  <QuestionFlags q={f.q} />
                </button>
              ))}
            </div>
          ) : (
            category && (
              <>
                {game.levels.map((l) => {
                  const cell = category.cells[l.id] ?? [];
                  return (
                    <div key={l.id} className="q-level-row" data-testid="level-row">
                      <div className="q-level-head">
                        <LevelValue levelId={l.id} value={l.value} />
                        <button className="icon-btn danger" title="Удалить уровень во всех категориях" onClick={() => setLevelToDelete(l.id)} data-testid="level-delete">
                          🗑
                        </button>
                      </div>
                      <div className="q-variants">
                        <AnimatePresence initial={false}>
                          {cell.map((q, i) => (
                            <motion.button
                              key={q.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={`q-variant ${sel?.questionId === q.id ? 'on' : ''} ${q.isPlaceholder ? 'placeholder' : ''}`}
                              onClick={() => {
                                play('click');
                                setSel({ categoryId: category.id, levelId: l.id, questionId: q.id });
                              }}
                              data-testid="q-variant"
                            >
                              <span className="q-variant-meta">Вариант {i + 1}</span>
                              <span className="q-variant-text">{q.text || <i className="muted">(пустой вопрос)</i>}</span>
                              <QuestionFlags q={q} />
                            </motion.button>
                          ))}
                        </AnimatePresence>
                        <button className="q-variant add" onClick={() => addVariant(l.id)} title="Добавить вариант вопроса в эту клетку — в игре выбирается случайный" data-testid="add-variant">
                          ＋ вариант
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button className="btn small wood-btn" onClick={addLevel} style={{ alignSelf: 'flex-start' }} data-testid="btn-add-level">
                  ＋ Добавить уровень ({(game.levels.at(-1)?.value ?? 0) + 100})
                </button>
              </>
            )
          )}
        </div>

        <div className="q-form-wrap">
          {sel ? (
            <QuestionForm key={sel.questionId} sel={sel} onDeleted={() => setSel(null)} onSelect={(questionId) => setSel({ ...sel, questionId })} />
          ) : (
            <p className="muted" style={{ padding: '2rem' }}>
              Выберите вопрос слева.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!levelToDelete}
        title="Удалить уровень?"
        text={`Уровень ${game.levels.find((l) => l.id === levelToDelete)?.value} будет удалён во всех категориях вместе с вопросами.`}
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          deleteLevel(levelToDelete!);
          setLevelToDelete(null);
        }}
        onCancel={() => setLevelToDelete(null)}
      />
    </div>
  );
}

function FilterChip({ on, onClick, label, testId }: { on: boolean; onClick: () => void; label: string; testId?: string }) {
  return (
    <button
      className={`filter-chip ${on ? 'on' : ''}`}
      onClick={() => {
        play('click');
        onClick();
      }}
      data-testid={testId}
    >
      {label}
    </button>
  );
}

function LevelValue({ levelId, value }: { levelId: string; value: number }) {
  const update = useContent((s) => s.update);
  const set = (v: number) =>
    update((g) => {
      const l = g.levels.find((x) => x.id === levelId);
      if (l) l.value = Math.max(0, v);
    });
  return (
    <div className="stepper" title="Цена уровня (для всех категорий)">
      <button onClick={() => set(value - 50)}>−</button>
      <input type="number" value={value} step={50} onChange={(e) => set(Number(e.target.value) || 0)} data-testid="level-value" />
      <button onClick={() => set(value + 50)}>+</button>
    </div>
  );
}
