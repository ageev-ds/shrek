import { useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/ui';
import { useContent, useGame } from '../../store/content';
import { play } from '../../audio/sounds';
import { assetUrl, uploadImage } from '../../lib/assets';
import { uid } from '../../lib/ids';
import type { Background, ScreenSlot } from '../../types/game';
import { toast } from './toast';

const SLOTS: { id: ScreenSlot; label: string }[] = [
  { id: 'menu', label: 'Главное меню' },
  { id: 'board', label: 'Игровое поле' },
  { id: 'question', label: 'Экран вопроса' },
  { id: 'finale', label: 'Финал' },
];

export function BackgroundsEditor() {
  const game = useGame();
  const update = useContent((s) => s.update);
  const [slot, setSlot] = useState<ScreenSlot>('menu');
  const [toDelete, setToDelete] = useState<Background | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { library, active, blur, dim } = game.backgrounds;
  const activeBg = library.find((b) => b.id === active[slot]);

  const upload = async (file?: File) => {
    if (!file) return;
    try {
      const src = await uploadImage(file, 2560);
      const id = uid('bg');
      update((g) => {
        g.backgrounds.library.push({ id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40), src });
        g.backgrounds.active[slot] = id;
      });
      play('add');
      toast('Фон загружен и назначен');
    } catch (e) {
      toast(`Не удалось загрузить фон: ${String(e)}`, 'error');
    }
  };

  return (
    <div className="dev-panel">
      <div className="dev-panel-head">
        <div>
          <h2>Фоны</h2>
          <p className="muted">Выберите экран, затем фон для него. Можно загрузить свой (jpg, png, webp).</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0]).finally(() => (e.target.value = ''))} data-testid="bg-file" />
          <button className="btn small green" onClick={() => fileRef.current?.click()}>
            ⤓ Загрузить свой фон
          </button>
        </div>
      </div>

      <div className="slot-tabs">
        {SLOTS.map((s) => {
          const bg = library.find((b) => b.id === active[s.id]);
          return (
            <button
              key={s.id}
              className={`slot-tab ${slot === s.id ? 'on' : ''}`}
              onClick={() => {
                play('click');
                setSlot(s.id);
              }}
            >
              <span className="slot-thumb" style={{ backgroundImage: bg ? `url("${assetUrl(bg.src)}")` : undefined }} />
              <span>
                <b>{s.label}</b>
                <br />
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {bg?.name ?? '—'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-split">
        <div className="bg-gallery">
          {library.map((b) => (
            <div key={b.id} className={`bg-card ${active[slot] === b.id ? 'on' : ''}`}>
              <button
                className="bg-thumb"
                style={{ backgroundImage: `url("${assetUrl(b.src)}")` }}
                onClick={() => {
                  play('click');
                  update((g) => {
                    g.backgrounds.active[slot] = b.id;
                  });
                }}
                title="Назначить на выбранный экран"
              />
              <div className="bg-card-foot">
                <span>{b.name}</span>
                {b.builtin ? (
                  <span className="badge">встроенный</span>
                ) : (
                  <button className="icon-btn danger" onClick={() => setToDelete(b)} title="Удалить фон">
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-preview-col">
          <div className="bg-preview">
            <div className="bg-preview-img" style={{ backgroundImage: activeBg ? `url("${assetUrl(activeBg.src)}")` : undefined, filter: `blur(${blur}px)` }} />
            <div className="bg-preview-dim" style={{ background: `rgba(10,16,6,${dim})` }} />
            <div className="bg-preview-text">
              <div className="gold-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.6rem' }}>
                Так будет читаться текст
              </div>
              <div>Какого цвета Шрек?</div>
            </div>
          </div>
          <label className="field">
            <span>Размытие: {blur}px</span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={blur}
              onChange={(e) =>
                update((g) => {
                  g.backgrounds.blur = Number(e.target.value);
                })
              }
              data-testid="bg-blur"
            />
          </label>
          <label className="field">
            <span>Затемнение: {Math.round(dim * 100)}%</span>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={dim}
              onChange={(e) =>
                update((g) => {
                  g.backgrounds.dim = Number(e.target.value);
                })
              }
            />
          </label>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Удалить фон?"
        text={`«${toDelete?.name}» будет удалён из библиотеки. Экраны с этим фоном переключатся на встроенный.`}
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          const id = toDelete!.id;
          setToDelete(null);
          play('remove');
          update((g) => {
            g.backgrounds.library = g.backgrounds.library.filter((b) => b.id !== id);
            for (const s of Object.keys(g.backgrounds.active) as ScreenSlot[]) if (g.backgrounds.active[s] === id) g.backgrounds.active[s] = g.backgrounds.library[0].id;
          });
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
