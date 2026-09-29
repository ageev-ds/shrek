import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Backdrop, ConfirmDialog, Logo } from '../../components/ui';
import { useGame } from '../../store/content';
import { useSession } from '../../store/session';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';
import type { SessionSnapshot } from '../../types/game';
import { SettingsModal } from './SettingsModal';
import { requestDevMode } from '../DevMode/devAccess';
import { pluralRu } from '../../lib/ids';

export function StartScreen() {
  const game = useGame();
  const go = useUi((s) => s.go);
  const settingsOpen = useUi((s) => s.settingsOpen);
  const setUi = useUi((s) => s.set);
  const resume = useSession((s) => s.resume);
  const [saved, setSaved] = useState<SessionSnapshot | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    void window.api.loadSession().then((s) => {
      const snap = s as SessionSnapshot | null;
      if (snap?.teams?.length) setSaved(snap);
    });
  }, []);

  const placeholders = game.categories.flatMap((c) => Object.values(c.cells).flat()).filter((q) => q.isPlaceholder).length;

  const item = (i: number) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 1.4 + i * 0.12, type: 'spring' as const, stiffness: 260, damping: 20 },
  });

  return (
    <div className="screen start-screen">
      <Backdrop slot="menu" />
      <div className="start-content">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}>
          <Logo title={game.meta.title} subtitle={game.meta.subtitle} />
        </motion.div>

        <div className="start-buttons">
          <motion.button
            {...item(0)}
            className="btn big"
            onClick={() => {
              play('click');
              go('teams');
            }}
            onMouseEnter={() => play('hover')}
            data-testid="btn-play"
          >
            ▶ Играть
          </motion.button>
          {saved && (
            <motion.button
              {...item(1)}
              className="btn green"
              onClick={() => {
                play('click');
                resume(saved, game);
                go('board');
              }}
              onMouseEnter={() => play('hover')}
              data-testid="btn-resume"
            >
              ⟲ Продолжить игру ({saved.teams.length} {pluralRu(saved.teams.length, 'команда', 'команды', 'команд')})
            </motion.button>
          )}
          <motion.div {...item(2)} className="row">
            <button
              className="btn wood-btn"
              onClick={() => {
                play('click');
                setUi({ settingsOpen: true });
              }}
              onMouseEnter={() => play('hover')}
            >
              ⚙ Настройки
            </button>
            <button className="btn wood-btn" onClick={() => setConfirmQuit(true)} onMouseEnter={() => play('hover')}>
              ⏻ Выход
            </button>
          </motion.div>
        </div>
      </div>

      <motion.button
        className="dev-corner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        onClick={() => requestDevMode()}
        title="Режим разработчика (Ctrl+Shift+D)"
        data-testid="btn-dev"
      >
        🔒 Режим разработчика
        {placeholders > 0 && <span className="badge warn">{placeholders}</span>}
      </motion.button>
      <div className="start-hint muted">
        <kbd>F11</kbd> — полный экран · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> — редактор
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setUi({ settingsOpen: false })} />
      <ConfirmDialog
        open={confirmQuit}
        title="Выйти из игры?"
        confirmLabel="Выйти"
        danger
        onConfirm={() => window.api.quit()}
        onCancel={() => setConfirmQuit(false)}
      />
    </div>
  );
}
