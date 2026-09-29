import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { ConfirmDialog, Modal } from '../../components/ui';
import { useContent, useGame } from '../../store/content';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';
import { uid } from '../../lib/ids';
import type { Category } from '../../types/game';
import { toast } from './toast';

export const EMOJIS = ['🧅', '👑', '🏰', '🐱', '🍪', '🎵', '🎂', '🐉', '🫏', '🪄', '🧚', '🐸', '🥕', '🌟', '🍰', '🎁', '🎈', '🎉', '🦴', '🐺', '🐷', '🐭', '🪞', '🗡', '🛡', '🏹', '🍄', '🌿', '🌙', '🔥', '💚', '📜', '🎭', '🎬', '🍿', '🧙', '👸', '🤴', '🦄', '🍯'];
export const COLORS = ['#6b8e23', '#3a5a2b', '#b8860b', '#d4a017', '#8b4513', '#c0392b', '#d2691e', '#6a5acd', '#2e86c1', '#16a085', '#8e44ad', '#e84393', '#7f8c8d', '#34495e'];

export function CategoriesEditor() {
  const game = useGame();
  const update = useContent((s) => s.update);
  const setUi = useUi((s) => s.set);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    play('click');
    update((g) => {
      const from = g.categories.findIndex((c) => c.id === e.active.id);
      const to = g.categories.findIndex((c) => c.id === e.over!.id);
      g.categories = arrayMove(g.categories, from, to);
    });
  };

  const add = () => {
    play('add');
    const id = uid('cat');
    update((g) => {
      g.categories.push({
        id,
        title: `Новая категория ${g.categories.length + 1}`,
        emoji: EMOJIS[g.categories.length % EMOJIS.length],
        color: COLORS[g.categories.length % COLORS.length],
        cells: Object.fromEntries(g.levels.map((l) => [l.id, [{ id: uid('q'), text: 'Текст вопроса', answer: 'Ответ' }]])),
      });
    });
  };

  const importCategory = async () => {
    try {
      const c = await window.api.importCategory();
      if (!c) return;
      update((g) => {
        const cells: Category['cells'] = {};
        const levelIds = Object.keys(c.cells);
        g.levels.forEach((l, i) => {
          // Сопоставляем по id уровня, а если не совпадает — по порядку
          const src = c.cells[l.id] ?? c.cells[levelIds[i]] ?? [];
          cells[l.id] = src.map((q) => ({ ...q, id: uid('q') }));
        });
        g.categories.push({ ...c, id: uid('cat'), cells });
      });
      toast(`Категория «${c.title}» импортирована`);
    } catch (e) {
      toast(`Не удалось импортировать: ${String(e)}`, 'error');
    }
  };

  return (
    <div className="dev-panel">
      <div className="dev-panel-head">
        <div>
          <h2>Категории</h2>
          <p className="muted">Перетаскивайте за ⠿, чтобы поменять порядок столбцов на игровом поле.</p>
        </div>
        <div className="row">
          <button className="btn small wood-btn" onClick={() => void importCategory()}>
            ⤓ Импорт категории
          </button>
          <button className="btn small green" onClick={add} data-testid="btn-add-category">
            ＋ Добавить категорию
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={game.categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="cat-list">
            {game.categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                onDelete={() => setToDelete(c)}
                onOpen={() => {
                  play('click');
                  setUi({ devSection: 'questions', devCategoryId: c.id });
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!toDelete}
        title="Удалить категорию?"
        text={toDelete && `«${toDelete.title}» и все её вопросы будут удалены. Это действие нельзя отменить (но можно заранее сделать экспорт).`}
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          const id = toDelete!.id;
          setToDelete(null);
          play('remove');
          update((g) => {
            g.categories = g.categories.filter((c) => c.id !== id);
          });
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function CategoryRow({ category: c, onDelete, onOpen }: { category: Category; onDelete: () => void; onOpen: () => void }) {
  const update = useContent((s) => s.update);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const [emojiOpen, setEmojiOpen] = useState(false);
  const count = Object.values(c.cells).flat().length;
  const set = (patch: Partial<Category>) =>
    update((g) => {
      const cat = g.categories.find((x) => x.id === c.id);
      if (cat) Object.assign(cat, patch);
    });

  return (
    <div
      ref={setNodeRef}
      className={`cat-row ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition, ['--cat' as string]: c.color }}
      data-testid="category-row"
    >
      <button className="drag-handle" {...attributes} {...listeners} title="Перетащить">
        ⠿
      </button>
      <button className="cat-emoji-btn" onClick={() => setEmojiOpen(true)} title="Сменить иконку">
        {c.emoji}
      </button>
      <input className="input cat-title-input" value={c.title} onChange={(e) => set({ title: e.target.value })} data-testid="category-title" />
      <div className="color-swatches">
        {COLORS.slice(0, 8).map((col) => (
          <button key={col} className={`swatch ${c.color === col ? 'on' : ''}`} style={{ background: col }} onClick={() => set({ color: col })} title={col} />
        ))}
        <label className="swatch custom" title="Свой цвет" style={{ background: c.color }}>
          <input type="color" value={c.color} onChange={(e) => set({ color: e.target.value })} />
          🎨
        </label>
      </div>
      <span className="muted cat-count">{count} вопр.</span>
      <button className="btn small wood-btn" onClick={onOpen}>
        Вопросы →
      </button>
      <button className="icon-btn" title="Экспорт категории в .json" onClick={() => void window.api.exportCategory(c).then((p) => p && toast(`Категория сохранена: ${p}`))}>
        ⤒
      </button>
      <button className="icon-btn danger" title="Удалить категорию" onClick={onDelete} data-testid="category-delete">
        🗑
      </button>

      <Modal open={emojiOpen} onClose={() => setEmojiOpen(false)} width={520}>
        <div className="col">
          <h3 className="gold-text">Иконка категории</h3>
          <div className="emoji-grid">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={`emoji-cell ${e === c.emoji ? 'on' : ''}`}
                onClick={() => {
                  set({ emoji: e });
                  setEmojiOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Или введите свой эмодзи / символ</span>
            <input className="input" maxLength={4} value={c.emoji} onChange={(e) => set({ emoji: e.target.value })} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
