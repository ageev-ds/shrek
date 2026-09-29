import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useContent } from './store/content';
import { setSessionPersistence, useSession } from './store/session';
import { useUi, type Screen } from './store/ui';
import { initSounds, play } from './audio/sounds';
import { useHotkey } from './hooks/useHotkey';
import { Modal } from './components/ui';
import { StartScreen } from './modes/GameMode/StartScreen';
import { TeamSetup } from './modes/GameMode/TeamSetup';
import { Board } from './modes/GameMode/Board';
import { Finale } from './modes/GameMode/Finale';
import { DevMode } from './modes/DevMode/DevMode';
import { enterDev, requestDevMode } from './modes/DevMode/devAccess';

const SCREENS: Record<Exclude<Screen, 'question'>, () => JSX.Element> = {
  start: StartScreen,
  teams: TeamSetup,
  board: Board,
  finale: Finale,
  dev: DevMode,
};

export function App() {
  const game = useContent((s) => s.game);
  const load = useContent((s) => s.load);
  const screen = useUi((s) => s.screen);
  const preview = useUi((s) => s.preview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load().catch((e) => setError(String(e)));
    void initSounds();
  }, [load]);

  useHotkey('ctrl+shift+d', () => requestDevMode());

  if (error) {
    return (
      <div className="screen" style={{ display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <div className="wood rivets" style={{ padding: '2rem', maxWidth: 700 }}>
          <h2 className="gold-text">Не удалось загрузить игру</h2>
          <p>{error}</p>
          <p className="muted">Подробности — в логах: %APPDATA%\shrek-jeopardy\logs\main.log</p>
        </div>
      </div>
    );
  }
  if (!game) return <Splash />;

  const Current = SCREENS[screen === 'question' ? 'board' : screen];

  return (
    <div className="grain" style={{ position: 'absolute', inset: 0 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <Current />
        </motion.div>
      </AnimatePresence>
      {preview && screen !== 'dev' && <PreviewExit />}
      <PasswordPrompt />
    </div>
  );
}

function Splash() {
  return (
    <div className="screen" style={{ display: 'grid', placeItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }} style={{ fontSize: '4rem' }}>
        🧅
      </motion.div>
    </div>
  );
}

function PreviewExit() {
  return (
    <motion.button
      className="btn small preview-exit"
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      onClick={() => {
        play('click');
        useSession.getState().clear();
        setSessionPersistence(true);
        useUi.getState().set({ screen: 'dev', preview: false });
      }}
      data-testid="btn-exit-preview"
    >
      ← Вернуться в редактор (предпросмотр)
    </motion.button>
  );
}

function PasswordPrompt() {
  const open = useUi((s) => s.passwordPrompt);
  const set = useUi((s) => s.set);
  const password = useContent((s) => s.game?.settings.devPassword ?? '');
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (open) {
      setValue('');
      setWrong(false);
    }
  }, [open]);

  const submit = () => {
    if (value === password) {
      play('correct');
      enterDev();
    } else {
      play('wrong');
      setWrong(true);
    }
  };

  return (
    <Modal open={open} onClose={() => set({ passwordPrompt: false })} width={440}>
      <div className="col" style={{ gap: '1rem', textAlign: 'center' }}>
        <h2 className="gold-text">🔒 Режим разработчика</h2>
        <motion.input
          className="input"
          type="password"
          autoFocus
          placeholder="Пароль"
          value={value}
          animate={wrong ? { x: [0, -12, 12, -8, 8, 0] } : {}}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          data-testid="dev-password"
        />
        {wrong && <span style={{ color: 'var(--danger-light)' }}>Неверный пароль</span>}
        <button className="btn" onClick={submit}>
          Войти
        </button>
      </div>
    </Modal>
  );
}
