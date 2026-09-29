import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ConfirmDialog, SavedBadge } from '../../components/ui';
import { useContent, useGame } from '../../store/content';
import { setSessionPersistence, useSession } from '../../store/session';
import { useUi, type DevSection } from '../../store/ui';
import { play } from '../../audio/sounds';
import { useHotkey } from '../../hooks/useHotkey';
import { uid } from '../../lib/ids';
import { CategoriesEditor } from './CategoriesEditor';
import { QuestionsEditor } from './QuestionsEditor';
import { BackgroundsEditor } from './BackgroundsEditor';
import { TeamsEditor } from './TeamsEditor';
import { SettingsEditor } from './SettingsEditor';
import { toast, Toaster } from './toast';
import './dev.css';

const NAV: { id: DevSection; icon: string; label: string }[] = [
  { id: 'categories', icon: '🗂', label: 'Категории' },
  { id: 'questions', icon: '❓', label: 'Вопросы' },
  { id: 'backgrounds', icon: '🖼', label: 'Фоны' },
  { id: 'teams', icon: '👥', label: 'Команды по умолчанию' },
  { id: 'settings', icon: '⚙', label: 'Настройки игры' },
];

export function DevMode() {
  const game = useGame();
  const section = useUi((s) => s.devSection);
  const setUi = useUi((s) => s.set);
  const replace = useContent((s) => s.replace);
  const flush = useContent((s) => s.flush);
  const [confirmImport, setConfirmImport] = useState(false);

  const all = game.categories.flatMap((c) => Object.values(c.cells).flat());
  const placeholders = all.filter((q) => q.isPlaceholder).length;
  const verify = all.filter((q) => q.verify).length;

  const exit = async () => {
    await flush();
    play('click');
    setUi({ screen: 'start' });
  };
  useHotkey('escape', () => void exit());

  const startPreview = async () => {
    await flush();
    play('open');
    setSessionPersistence(false);
    useSession.getState().clear();
    useSession.setState({
      teams: [
        { id: uid('team'), name: 'Тестовые огры', avatar: 'shrek', score: 0 },
        { id: uid('team'), name: 'Тестовые ослики', avatar: 'donkey', score: 0 },
      ],
    });
    setUi({ preview: true, screen: 'teams' });
  };

  const doExport = async () => {
    await flush();
    const path = await window.api.exportGame(game);
    if (path) toast(`Игра сохранена: ${path}`);
  };
  const doImport = async () => {
    setConfirmImport(false);
    try {
      const g = await window.api.importGame();
      if (g) {
        replace(g, false);
        toast('Игра импортирована ✓ (прежняя версия сохранена в gameData.backup.json)');
      }
    } catch (e) {
      toast(`Не удалось импортировать: ${String(e).replace(/^Error: (Error invoking remote method '[^']+': )?(Error: )?/, '')}`, 'error');
    }
  };

  return (
    <div className="screen dev-screen" data-testid="dev-mode">
      <aside className="dev-nav wood">
        <div className="dev-brand">
          <span>🛠</span>
          <div>
            <b>Редактор</b>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              {game.meta.title}
            </div>
          </div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`dev-nav-item ${section === n.id ? 'on' : ''}`}
              onClick={() => {
                play('click');
                setUi({ devSection: n.id });
              }}
              data-testid={`nav-${n.id}`}
            >
              {section === n.id && <motion.span layoutId="dev-nav-glow" className="dev-nav-glow" />}
              <span className="dev-nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="spacer" />
        <div className="dev-stats muted">
          <div>Категорий: {game.categories.length}</div>
          <div>Уровней: {game.levels.length}</div>
          <div>Вопросов: {all.length}</div>
        </div>
        <button className="btn wood-btn small" onClick={() => void exit()}>
          ← В главное меню
        </button>
      </aside>

      <main className="dev-main">
        <header className="dev-top">
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {placeholders > 0 && (
              <button
                className="badge warn dev-alert"
                onClick={() => setUi({ devSection: 'questions' })}
                title="Вопросы-заготовки про именинницу — замените их своими"
              >
                ⚠ Замени меня: {placeholders}
              </button>
            )}
            {verify > 0 && (
              <button className="badge dev-alert" onClick={() => setUi({ devSection: 'questions' })} title="Факты, которые стоит перепроверить">
                🔍 Проверить: {verify}
              </button>
            )}
          </div>
          <div className="spacer" />
          <SavedBadge />
          <button className="btn small wood-btn" onClick={() => setConfirmImport(true)} data-testid="btn-import-game">
            ⤓ Импорт
          </button>
          <button className="btn small wood-btn" onClick={() => void doExport()} data-testid="btn-export-game">
            ⤒ Экспорт
          </button>
          <button className="btn small green" onClick={() => void startPreview()} data-testid="btn-preview">
            ▶ Предпросмотр
          </button>
        </header>
        <AnimatePresence mode="wait">
          <motion.section
            key={section}
            className="dev-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            {section === 'categories' && <CategoriesEditor />}
            {section === 'questions' && <QuestionsEditor />}
            {section === 'backgrounds' && <BackgroundsEditor />}
            {section === 'teams' && <TeamsEditor />}
            {section === 'settings' && <SettingsEditor />}
          </motion.section>
        </AnimatePresence>
      </main>

      <ConfirmDialog
        open={confirmImport}
        title="Импортировать игру?"
        text="Текущая игра будет заменена содержимым файла. Резервная копия сохранится в gameData.backup.json. Совет: сначала сделайте экспорт."
        confirmLabel="Выбрать файл…"
        onConfirm={() => void doImport()}
        onCancel={() => setConfirmImport(false)}
      />
      <Toaster />
    </div>
  );
}
