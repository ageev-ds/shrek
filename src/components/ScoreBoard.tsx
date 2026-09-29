import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useSession } from '../store/session';
import { Avatar } from './art';
import { AnimatedNumber, Modal } from './ui';
import { play } from '../audio/sounds';
import './ScoreBoard.css';

export function ScoreBoard({ interactive = true, highlightId }: { interactive?: boolean; highlightId?: string | null }) {
  const teams = useSession((s) => s.teams);
  const activeId = useSession((s) => s.activeTeamId);
  const lastDelta = useSession((s) => s.lastDelta);
  const setActive = useSession((s) => s.setActive);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const shownActive = highlightId ?? activeId;

  return (
    <div className="scoreboard" data-testid="scoreboard">
      {teams.map((t) => {
        const active = t.id === shownActive;
        const delta = lastDelta?.teamId === t.id ? lastDelta : null;
        return (
          <motion.div
            key={t.id}
            layout
            className={`score-card ${active ? 'active' : ''} ${interactive ? 'clickable' : ''}`}
            onClick={() => {
              if (!interactive) return;
              play('click');
              setActive(t.id);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (interactive) setAdjustId(t.id);
            }}
            title={interactive ? 'Клик — сделать активной, правый клик — поправить счёт' : undefined}
            data-testid={`score-${t.name}`}
          >
            {active && <motion.div className="score-glow" layoutId="score-glow" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
            <Avatar id={t.avatar} size={44} />
            <div className="score-body">
              <div className="score-name">{t.name}</div>
              <motion.div
                key={delta?.at ?? 'n'}
                className={`score-value ${t.score < 0 ? 'neg' : ''}`}
                initial={delta ? { scale: 1.6 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                data-testid="score-value"
              >
                <AnimatedNumber value={t.score} />
              </motion.div>
            </div>
            <AnimatePresence>
              {delta && (
                <motion.span
                  key={delta.at}
                  className={`score-delta ${delta.delta >= 0 ? 'plus' : 'minus'}`}
                  initial={{ opacity: 0, y: 10, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [10, -18, -26, -40], scale: [0.6, 1.3, 1, 1] }}
                  transition={{ duration: 1.8, times: [0, 0.2, 0.7, 1] }}
                >
                  {delta.delta > 0 ? `+${delta.delta}` : delta.delta === 0 ? '±0' : delta.delta}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      <AdjustScoreModal teamId={adjustId} onClose={() => setAdjustId(null)} />
    </div>
  );
}

function AdjustScoreModal({ teamId, onClose }: { teamId: string | null; onClose: () => void }) {
  const team = useSession((s) => s.teams.find((t) => t.id === teamId));
  const adjust = useSession((s) => s.adjustScore);
  const [amount, setAmount] = useState(100);
  return (
    <Modal open={!!team} onClose={onClose} width={460}>
      {team && (
        <div className="col" style={{ gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
          <h2 className="gold-text">Поправить счёт</h2>
          <div className="row">
            <Avatar id={team.avatar} size={56} />
            <b style={{ fontSize: '1.3rem' }}>{team.name}</b>
          </div>
          <input className="input" type="number" step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} style={{ maxWidth: 180, textAlign: 'center', fontSize: '1.3rem' }} />
          <div className="row">
            <button
              className="btn red"
              onClick={() => {
                adjust(team.id, -Math.abs(amount));
                play('wrong');
                onClose();
              }}
            >
              − Снять
            </button>
            <button
              className="btn green"
              onClick={() => {
                adjust(team.id, Math.abs(amount));
                play('correct');
                onClose();
              }}
            >
              + Начислить
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
