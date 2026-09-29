import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui';
import { useContent, useGame } from '../../store/content';
import { play } from '../../audio/sounds';

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame();
  const update = useContent((s) => s.update);
  const [fullscreen, setFullscreen] = useState(true);
  const s = game.settings;

  useEffect(() => {
    if (open) void window.api.isFullscreen().then(setFullscreen);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div className="col" style={{ gap: '1.3rem' }}>
        <h2 className="gold-text" style={{ fontSize: '2rem', textAlign: 'center' }}>
          Настройки
        </h2>
        <label className={`check ${s.soundEnabled ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={s.soundEnabled}
            onChange={(e) =>
              update((g) => {
                g.settings.soundEnabled = e.target.checked;
              })
            }
          />
          🔊 Звук включён
        </label>
        <label className="field">
          <span>Громкость: {Math.round(s.volume * 100)}%</span>
          <div className="row">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.volume}
              onChange={(e) =>
                update((g) => {
                  g.settings.volume = Number(e.target.value);
                })
              }
            />
            <button className="btn small wood-btn" onClick={() => play('correct')}>
              ♪ Проверить
            </button>
          </div>
        </label>
        <label className="field">
          <span>Время на ответ: {s.defaultTimerSec} сек</span>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={s.defaultTimerSec}
            onChange={(e) =>
              update((g) => {
                g.settings.defaultTimerSec = Number(e.target.value);
              })
            }
          />
        </label>
        <label className={`check ${fullscreen ? 'on' : ''}`}>
          <input type="checkbox" checked={fullscreen} onChange={async () => setFullscreen(await window.api.toggleFullscreen())} />
          🖥 Полноэкранный режим <span className="muted">(F11)</span>
        </label>
        <button className="btn" onClick={onClose} style={{ alignSelf: 'center' }}>
          Готово
        </button>
      </div>
    </Modal>
  );
}
