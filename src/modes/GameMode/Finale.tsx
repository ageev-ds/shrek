import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Backdrop, Modal, Plaque } from '../../components/ui';
import { Avatar } from '../../components/art';
import { useGame } from '../../store/content';
import { useSession } from '../../store/session';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';
import { useHotkey } from '../../hooks/useHotkey';
import type { SessionTeam } from '../../types/game';

const PODIUM = [
  { place: 2, height: 190, order: 0, color: '#c0c7cf' },
  { place: 1, height: 260, order: 1, color: '#f1c94b' },
  { place: 3, height: 140, order: 2, color: '#cd7f32' },
];

export function Finale() {
  const game = useGame();
  const teams = useSession((s) => s.teams);
  const restart = useSession((s) => s.restart);
  const go = useUi((s) => s.go);
  const [statsOpen, setStatsOpen] = useState(false);

  const ranked = useMemo(() => [...teams].sort((a, b) => b.score - a.score), [teams]);
  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const winners = ranked.filter((t) => ranked[0] && t.score === ranked[0].score);

  useEffect(() => {
    void window.api.clearSession();
    const colors = ['#f1c94b', '#6b8e23', '#c0392b', '#f5e6c8', '#8e44ad'];
    const fire = (ratio: number, opts: confetti.Options) =>
      confetti({ origin: { y: 0.7 }, colors, disableForReducedMotion: true, ...opts, particleCount: Math.floor(220 * ratio) });
    const t1 = setTimeout(() => {
      play('fanfare');
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.3 });
    }, 1500);
    const t2 = setInterval(() => {
      confetti({ particleCount: 40, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors });
      confetti({ particleCount: 40, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors });
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearInterval(t2);
      confetti.reset();
    };
  }, []);

  useHotkey('escape', () => (statsOpen ? setStatsOpen(false) : go('start')));

  return (
    <div className="screen finale-screen" data-testid="finale">
      <Backdrop slot="finale" />
      <motion.div className="finale-head" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120 }}>
        <Plaque className="finale-title">🏆 Награждение 🏆</Plaque>
        {winners.length > 0 && (
          <motion.p className="finale-winner" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}>
            {winners.length > 1 ? 'Ничья! Победители: ' : 'Победитель: '}
            <b className="gold-text">{winners.map((w) => w.name).join(', ')}</b>
          </motion.p>
        )}
      </motion.div>

      <div className="podium">
        {PODIUM.map((p) => {
          const team = top[p.place - 1];
          if (!team) return <div key={p.place} className="podium-slot" style={{ order: p.order }} />;
          return <PodiumSlot key={team.id} team={team} place={p.place} height={p.height} color={p.color} order={p.order} />;
        })}
      </div>

      {rest.length > 0 && (
        <motion.div className="finale-rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>
          {rest.map((t, i) => (
            <div key={t.id} className="finale-rest-item">
              <span className="muted">{i + 4}.</span> <Avatar id={t.avatar} size={32} /> {t.name} — <b>{t.score}</b>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div className="finale-actions" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}>
        <button className="btn wood-btn" onClick={() => setStatsOpen(true)} data-testid="btn-stats">
          📊 Показать статистику
        </button>
        <button
          className="btn big"
          onClick={() => {
            play('open');
            restart(game);
            go('board');
          }}
          data-testid="btn-replay"
        >
          ↻ Сыграть ещё раз
        </button>
        <button
          className="btn wood-btn"
          onClick={() => {
            play('click');
            go('start');
          }}
        >
          ⌂ В меню
        </button>
      </motion.div>

      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}

function PodiumSlot({ team, place, height, color, order }: { team: SessionTeam; place: number; height: number; color: string; order: number }) {
  const delay = place === 1 ? 1.3 : place === 2 ? 0.8 : 0.3;
  return (
    <div className="podium-slot" style={{ order }}>
      <motion.div
        className="podium-team"
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 90, damping: 14 }}
      >
        {place === 1 && (
          <motion.div
            className="podium-crown"
            initial={{ y: -260, rotate: -30, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ delay: 2, type: 'spring', stiffness: 120, damping: 9 }}
          >
            👑
          </motion.div>
        )}
        <motion.div animate={place === 1 ? { y: [0, -8, 0] } : {}} transition={{ repeat: Infinity, duration: 2, delay: 2.6 }}>
          <Avatar id={team.avatar} size={place === 1 ? 150 : 116} />
        </motion.div>
        <div className="podium-name">{team.name}</div>
        <div className="podium-score">{team.score}</div>
      </motion.div>
      <motion.div
        className="podium-block"
        style={{ ['--pc' as string]: color }}
        initial={{ height: 0 }}
        animate={{ height }}
        transition={{ delay: delay - 0.2, type: 'spring', stiffness: 80, damping: 15 }}
      >
        <span>{place}</span>
      </motion.div>
    </div>
  );
}

function StatsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame();
  const teams = useSession((s) => s.teams);
  const log = useSession((s) => s.log);

  const perTeam = teams.map((t) => {
    const entries = log.filter((e) => e.teamId === t.id);
    const byCat = Object.fromEntries(game.categories.map((c) => [c.id, entries.filter((e) => e.categoryId === c.id).reduce((s, e) => s + e.delta, 0)]));
    return {
      team: t,
      correct: entries.filter((e) => e.correct).length,
      wrong: entries.filter((e) => !e.correct).length,
      byCat,
    };
  });
  const maxAbs = Math.max(1, ...perTeam.flatMap((p) => Object.values(p.byCat).map(Math.abs)));

  return (
    <Modal open={open} onClose={onClose} width={1100}>
      <div className="col" style={{ gap: '1rem' }} data-testid="stats-modal">
        <h2 className="gold-text" style={{ textAlign: 'center', fontSize: '2rem' }}>
          Статистика игры
        </h2>
        <div className="stats-summary">
          {perTeam.map((p) => (
            <div key={p.team.id} className="stats-team">
              <Avatar id={p.team.avatar} size={56} />
              <div>
                <b>{p.team.name}</b>
                <div className="row" style={{ gap: '0.6rem' }}>
                  <span style={{ color: 'var(--ok-light)' }}>✔ {p.correct}</span>
                  <span style={{ color: 'var(--danger-light)' }}>✘ {p.wrong}</span>
                  <span className="gold-text">Σ {p.team.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Категория</th>
                {perTeam.map((p) => (
                  <th key={p.team.id}>{p.team.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {game.categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.emoji} {c.title}
                  </td>
                  {perTeam.map((p) => {
                    const v = p.byCat[c.id] ?? 0;
                    return (
                      <td key={p.team.id}>
                        <div className="stats-bar">
                          <motion.div
                            className={`stats-bar-fill ${v < 0 ? 'neg' : ''}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(Math.abs(v) / maxAbs) * 100}%` }}
                            transition={{ duration: 0.8 }}
                          />
                          <span>{v}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn" style={{ alignSelf: 'center' }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </Modal>
  );
}
