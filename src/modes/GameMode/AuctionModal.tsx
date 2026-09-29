import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/ui';
import { Avatar } from '../../components/art';
import { useSession } from '../../store/session';
import { play } from '../../audio/sounds';

interface Bid {
  amount: number;
  pass: boolean;
}

/**
 * «Аукцион»: каждая команда называет ставку не меньше цены вопроса (или «ва-банк» — весь свой счёт),
 * либо пасует. Отвечает команда с наибольшей ставкой. Если все спасовали — отвечает активная команда за номинал.
 */
export function AuctionModal({
  open,
  baseValue,
  onDone,
  onCancel,
}: {
  open: boolean;
  baseValue: number;
  onDone: (teamId: string, bid: number) => void;
  onCancel: () => void;
}) {
  const teams = useSession((s) => s.teams);
  const activeId = useSession((s) => s.activeTeamId);
  const maxFor = (score: number) => Math.max(score, baseValue);
  const [bids, setBids] = useState<Record<string, Bid>>({});

  useEffect(() => {
    if (open) setBids(Object.fromEntries(teams.map((t) => [t.id, { amount: baseValue, pass: t.id !== activeId }])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const leader = useMemo(() => {
    let best: { id: string; amount: number } | null = null;
    for (const t of teams) {
      const b = bids[t.id];
      if (!b || b.pass) continue;
      const amount = Math.min(maxFor(t.score), Math.max(baseValue, b.amount));
      if (!best || amount > best.amount) best = { id: t.id, amount };
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bids, teams, baseValue]);

  const setBid = (id: string, patch: Partial<Bid>) => setBids((b) => ({ ...b, [id]: { ...b[id], ...patch } }));
  const leaderTeam = teams.find((t) => t.id === (leader?.id ?? activeId));

  return (
    <Modal open={open} onClose={onCancel} width={820}>
      <div className="col" style={{ gap: '1.1rem' }} data-testid="auction-modal">
        <motion.h2
          className="cat-title"
          style={{ textAlign: 'center' }}
          initial={{ scale: 0.3 }}
          animate={{ scale: [0.3, 1.15, 1] }}
          transition={{ duration: 0.6 }}
        >
          🔨 АУКЦИОН!
        </motion.h2>
        <p style={{ textAlign: 'center', margin: 0 }} className="muted">
          Минимальная ставка — <b className="gold-text">{baseValue}</b>. Максимум — счёт команды (или цена вопроса, если счёт меньше).
        </p>
        <div className="auction-list">
          {teams.map((t) => {
            const b = bids[t.id] ?? { amount: baseValue, pass: true };
            const max = maxFor(t.score);
            const isLeader = leader?.id === t.id;
            return (
              <motion.div key={t.id} layout className={`auction-row ${b.pass ? 'pass' : ''} ${isLeader ? 'leader' : ''}`}>
                <Avatar id={t.avatar} size={48} />
                <div className="auction-name">
                  <b>{t.name}</b>
                  <span className="muted">счёт: {t.score}</span>
                </div>
                <input
                  className="input"
                  type="number"
                  min={baseValue}
                  max={max}
                  step={50}
                  value={b.amount}
                  disabled={b.pass}
                  onChange={(e) => setBid(t.id, { amount: Number(e.target.value) || 0 })}
                  onBlur={() => setBid(t.id, { amount: Math.min(max, Math.max(baseValue, b.amount)) })}
                  style={{ width: 130, textAlign: 'center', fontSize: '1.2rem' }}
                  data-testid={`bid-${t.name}`}
                />
                <button
                  className="btn small"
                  disabled={b.pass}
                  onClick={() => {
                    play('click');
                    setBid(t.id, { amount: max });
                  }}
                >
                  Ва-банк
                </button>
                <button
                  className={`btn small ${b.pass ? 'green' : 'wood-btn'}`}
                  onClick={() => {
                    play('click');
                    setBid(t.id, { pass: !b.pass });
                  }}
                  data-testid={`pass-${t.name}`}
                >
                  {b.pass ? 'Вступить' : 'Пас'}
                </button>
                {isLeader && <span className="auction-crown">👑</span>}
              </motion.div>
            );
          })}
        </div>
        <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <span>
            {leader ? (
              <>
                Отвечает <b className="gold-text">{leaderTeam?.name}</b> за <b className="gold-text">{leader.amount}</b>
              </>
            ) : (
              <>
                Все спасовали — отвечает <b className="gold-text">{leaderTeam?.name}</b> за <b className="gold-text">{baseValue}</b>
              </>
            )}
          </span>
          <button
            className="btn green"
            onClick={() => leaderTeam && onDone(leaderTeam.id, leader?.amount ?? baseValue)}
            data-testid="auction-done"
          >
            Продано! 🔨
          </button>
        </div>
      </div>
    </Modal>
  );
}
