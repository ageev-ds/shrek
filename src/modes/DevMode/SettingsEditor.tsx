import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/ui';
import { useContent, useGame } from '../../store/content';
import { useSession } from '../../store/session';
import { play } from '../../audio/sounds';
import type { Settings } from '../../types/game';
import { toast } from './toast';

export function SettingsEditor() {
  const game = useGame();
  const update = useContent((s) => s.update);
  const replace = useContent((s) => s.replace);
  const [resetStep, setResetStep] = useState(0);
  const [info, setInfo] = useState<{ version: string; dataDir: string } | null>(null);
  const s = game.settings;

  useEffect(() => {
    void window.api.info().then(setInfo);
  }, []);

  const setS = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    update((g) => {
      g.settings[k] = v;
    });

  const num = (k: 'defaultTimerSec' | 'catInBagTimerSec' | 'auctionTimerSec', label: string) => (
    <label className="field">
      <span>{label}</span>
      <div className="stepper big">
        <button onClick={() => setS(k, Math.max(5, s[k] - 5))}>−</button>
        <input type="number" min={5} value={s[k]} onChange={(e) => setS(k, Math.max(1, Number(e.target.value) || 1))} data-testid={`set-${k}`} />
        <button onClick={() => setS(k, s[k] + 5)}>+</button>
      </div>
    </label>
  );

  return (
    <div className="dev-panel settings-editor">
      <div className="dev-panel-head">
        <div>
          <h2>Настройки игры</h2>
          <p className="muted">Все изменения сохраняются автоматически.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <h3>Название</h3>
          <label className="field">
            <span>Заголовок игры</span>
            <input
              className="input"
              value={game.meta.title}
              onChange={(e) =>
                update((g) => {
                  g.meta.title = e.target.value;
                })
              }
              data-testid="set-title"
            />
          </label>
          <label className="field">
            <span>Подзаголовок</span>
            <input
              className="input"
              value={game.meta.subtitle}
              onChange={(e) =>
                update((g) => {
                  g.meta.subtitle = e.target.value;
                })
              }
            />
          </label>
        </section>

        <section className="settings-card">
          <h3>Таймеры</h3>
          {num('defaultTimerSec', 'Общий таймер, сек')}
          {num('catInBagTimerSec', 'Кот в мешке, сек')}
          {num('auctionTimerSec', 'Аукцион, сек')}
        </section>

        <section className="settings-card">
          <h3>Звук</h3>
          <label className={`check ${s.soundEnabled ? 'on' : ''}`}>
            <input type="checkbox" checked={s.soundEnabled} onChange={(e) => setS('soundEnabled', e.target.checked)} />
            🔊 Звук включён
          </label>
          <label className="field">
            <span>Громкость: {Math.round(s.volume * 100)}%</span>
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => setS('volume', Number(e.target.value))} />
          </label>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {(['click', 'correct', 'wrong', 'catInBag', 'timeUp', 'fanfare'] as const).map((id) => (
              <button key={id} className="btn small wood-btn" onClick={() => play(id)}>
                ♪ {{ click: 'клик', correct: 'верно', wrong: 'неверно', catInBag: 'кот', timeUp: 'гонг', fanfare: 'фанфары' }[id]}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-card">
          <h3>Цены уровней</h3>
          <div className="levels-edit">
            {game.levels.map((l, i) => (
              <label key={l.id} className="field">
                <span>Уровень {i + 1}</span>
                <input
                  className="input"
                  type="number"
                  step={50}
                  value={l.value}
                  onChange={(e) =>
                    update((g) => {
                      g.levels[i].value = Math.max(0, Number(e.target.value) || 0);
                    })
                  }
                  data-testid={`set-level-${i}`}
                />
              </label>
            ))}
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button
              className="btn small wood-btn"
              onClick={() =>
                update((g) => {
                  g.levels.forEach((l) => (l.value *= 2));
                })
              }
            >
              ×2 ко всем
            </button>
            <button
              className="btn small wood-btn"
              onClick={() =>
                update((g) => {
                  g.levels.forEach((l, i) => (l.value = (i + 1) * 100));
                })
              }
            >
              ↺ 100, 200, 300…
            </button>
            <button
              className="btn small wood-btn"
              onClick={() =>
                update((g) => {
                  g.levels.forEach((l, i) => (l.value = (i + 1) * 1000));
                })
              }
            >
              1000, 2000…
            </button>
          </div>
          <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
            Добавлять и удалять уровни можно в разделе «Вопросы».
          </p>
        </section>

        <section className="settings-card">
          <h3>Правила</h3>
          <label className={`check ${s.wrongAnswerPenalty ? 'on' : ''}`}>
            <input type="checkbox" checked={s.wrongAnswerPenalty} onChange={(e) => setS('wrongAnswerPenalty', e.target.checked)} />
            Снимать очки за неверный ответ
          </label>
          <label className={`check ${s.revealSpecialsOnBoard ? 'on' : ''}`}>
            <input type="checkbox" checked={s.revealSpecialsOnBoard} onChange={(e) => setS('revealSpecialsOnBoard', e.target.checked)} />
            Показывать «котов» и «аукционы» на поле заранее
          </label>
        </section>

        <section className="settings-card">
          <h3>Доступ к редактору</h3>
          <label className="field">
            <span>Пароль (пусто — без пароля)</span>
            <input className="input" type="text" value={s.devPassword} onChange={(e) => setS('devPassword', e.target.value)} placeholder="без пароля" data-testid="set-password" />
          </label>
        </section>

        <section className="settings-card danger-zone">
          <h3>Данные</h3>
          {info && (
            <p className="muted" style={{ fontSize: '0.8rem', margin: 0, wordBreak: 'break-all' }}>
              Версия {info.version}. Данные: {info.dataDir}
            </p>
          )}
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button className="btn small wood-btn" onClick={() => void window.api.openDataFolder()}>
              📂 Открыть папку данных
            </button>
            <button className="btn small red" onClick={() => setResetStep(1)} data-testid="btn-reset-all">
              ⚠ Сбросить всё
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={resetStep === 1}
        title="Сбросить всё?"
        text="Все категории, вопросы, картинки, фоны и настройки вернутся к исходным. Текущая версия сохранится в gameData.backup.json."
        confirmLabel="Да, сбросить"
        danger
        onConfirm={() => setResetStep(2)}
        onCancel={() => setResetStep(0)}
      />
      <ConfirmDialog
        open={resetStep === 2}
        title="Точно-точно?"
        text="Это последнее предупреждение. Вопросы про именинницу тоже вернутся к заготовкам."
        confirmLabel="Сбросить к дефолту"
        danger
        onConfirm={async () => {
          setResetStep(0);
          const g = await window.api.resetGame();
          replace(g, false);
          useSession.getState().clear();
          toast('Игра сброшена к исходной');
        }}
        onCancel={() => setResetStep(0)}
      />
    </div>
  );
}
