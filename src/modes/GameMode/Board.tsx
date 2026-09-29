import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Backdrop, ConfirmDialog } from '../../components/ui';
import { ScoreBoard } from '../../components/ScoreBoard';
import { useGame } from '../../store/content';
import { findQuestion, useSession } from '../../store/session';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';
import { useHotkey } from '../../hooks/useHotkey';
import { cellKey } from '../../lib/ids';
import { QuestionScreen } from './QuestionScreen';

export function Board() {
  const game = useGame();
  const go = useUi((s) => s.go);
  const played = useSession((s) => s.played);
  const variants = useSession((s) => s.variants);
  const current = useSession((s) => s.current);
  const open = useSession((s) => s.open);
  const activeTeam = useSession((s) => s.teams.find((t) => t.id === s.activeTeamId));
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmMenu, setConfirmMenu] = useState(false);

  const totalCells = game.categories.reduce((n, c) => n + game.levels.filter((l) => (c.cells[l.id] ?? []).length).length, 0);
  const allPlayed = totalCells > 0 && played.length >= totalCells;

  useHotkey('escape', () => setConfirmMenu(true), !current);

  const finish = () => go('finale');

  return (
    <div className="screen board-screen">
      <Backdrop slot="board" parallax={!current} fireflies={false} />
      <header className="board-header">
        <div className="row">
          <button className="btn wood-btn small" onClick={() => setConfirmMenu(true)}>
            ☰ Меню
          </button>
          <div className="board-title">
            <div className="board-title-main">{game.meta.title}</div>
            {activeTeam && (
              <motion.div key={activeTeam.id} className="board-turn" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                Выбирает: <b>{activeTeam.name}</b>
              </motion.div>
            )}
          </div>
        </div>
        <ScoreBoard interactive={!current} />
      </header>

      <div
        className="board-grid"
        style={{ gridTemplateColumns: `minmax(64px, 0.45fr) repeat(${game.categories.length}, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(${game.levels.length}, minmax(0, 1fr))` }}
        data-testid="board-grid"
      >
        <div className="board-corner">🧅</div>
        {game.categories.map((c, ci) => (
          <motion.div
            key={c.id}
            className="board-cat"
            style={{ ['--cat' as string]: c.color }}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.06 }}
          >
            <span className="board-cat-emoji">{c.emoji}</span>
            <span className="board-cat-title">{c.title}</span>
          </motion.div>
        ))}

        {game.levels.map((l, li) => (
          <FragmentRow key={l.id}>
            <div className="board-level">{l.value}</div>
            {game.categories.map((c, ci) => {
              const key = cellKey(c.id, l.id);
              const q = findQuestion(game, c.id, l.id, variants[key]);
              const isPlayed = played.includes(key);
              const empty = !q;
              const isOpen = current && cellKey(current.categoryId, current.levelId) === key;
              const special = game.settings.revealSpecialsOnBoard && q && !isPlayed ? (q.catInBag ? 'cat' : q.auction ? 'auction' : null) : null;
              const value = q?.valueOverride ?? l.value;
              return (
                <motion.button
                  key={key}
                  layoutId={`cell-${key}`}
                  className={`board-cell ${isPlayed ? 'played' : ''} ${empty ? 'empty' : ''} ${special ?? ''}`}
                  style={{ ['--cat' as string]: c.color, visibility: isOpen ? 'hidden' : 'visible' }}
                  disabled={isPlayed || empty || !!current}
                  initial={{ opacity: 0, rotateX: -90 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  transition={{ delay: 0.25 + (li * game.categories.length + ci) * 0.02, type: 'spring', stiffness: 200, damping: 18 }}
                  whileHover={!isPlayed && !empty ? { scale: 1.06, zIndex: 3 } : undefined}
                  whileTap={!isPlayed && !empty ? { scale: 0.96 } : undefined}
                  onMouseEnter={() => !isPlayed && !empty && play('hover')}
                  onClick={() => {
                    const cur = open(c.id, l.id, game);
                    if (!cur) return;
                    play(cur.kind === 'cat' ? 'catInBag' : cur.kind === 'auction' ? 'auction' : 'open');
                  }}
                  data-testid={`cell-${ci}-${li}`}
                  data-played={isPlayed ? '1' : '0'}
                >
                  {isPlayed ? (
                    <span className="cell-stamp">сыграно</span>
                  ) : empty ? (
                    <span className="muted">—</span>
                  ) : (
                    <>
                      <span className="cell-value">{value}</span>
                      {special === 'cat' && <span className="cell-special">🐱 кот в мешке</span>}
                      {special === 'auction' && <span className="cell-special">🔨 аукцион</span>}
                    </>
                  )}
                </motion.button>
              );
            })}
          </FragmentRow>
        ))}
      </div>

      <footer className="board-footer">
        <span className="muted">
          Сыграно {played.length} из {totalCells}
        </span>
        <AnimatePresence>
          {allPlayed && !current && (
            <motion.span className="gold-text" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontWeight: 800 }}>
              Все вопросы сыграны! 🎉
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          className={`btn ${allPlayed ? '' : 'wood-btn'}`}
          animate={allPlayed ? { scale: [1, 1.08, 1] } : {}}
          transition={allPlayed ? { repeat: Infinity, duration: 1.4 } : undefined}
          onClick={() => (allPlayed ? finish() : setConfirmEnd(true))}
          data-testid="btn-finish"
        >
          🏆 Завершить игру
        </motion.button>
      </footer>

      <AnimatePresence>{current && <QuestionScreen key={cellKey(current.categoryId, current.levelId)} />}</AnimatePresence>

      <ConfirmDialog
        open={confirmEnd}
        title="Завершить игру?"
        text={`Осталось ${totalCells - played.length} несыгранных вопросов. Перейти к награждению?`}
        confirmLabel="К награждению"
        onConfirm={() => {
          setConfirmEnd(false);
          finish();
        }}
        onCancel={() => setConfirmEnd(false)}
      />
      <ConfirmDialog
        open={confirmMenu}
        title="Выйти в главное меню?"
        text="Партия сохранится — её можно будет продолжить кнопкой «Продолжить игру»."
        confirmLabel="В меню"
        onConfirm={() => {
          setConfirmMenu(false);
          go('start');
        }}
        onCancel={() => setConfirmMenu(false)}
      />
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

