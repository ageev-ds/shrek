import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui';
import { Avatar, AVATARS, ArtMedallion } from '../../components/art';
import { useSession } from '../../store/session';
import { play } from '../../audio/sounds';

/** «Кот в мешке»: мешок трясётся, выпрыгивает кот, активная команда отдаёт вопрос другой */
export function CatInBagModal({
  open,
  value,
  doubled,
  onPick,
  onCancel,
}: {
  open: boolean;
  value: number;
  doubled: boolean;
  onPick: (teamId: string) => void;
  onCancel: () => void;
}) {
  const teams = useSession((s) => s.teams);
  const activeId = useSession((s) => s.activeTeamId);
  const active = teams.find((t) => t.id === activeId);
  const others = teams.filter((t) => t.id !== activeId);
  const [stage, setStage] = useState<'bag' | 'cat'>('bag');

  useEffect(() => {
    if (!open) return;
    setStage('bag');
    const t = setTimeout(() => {
      setStage('cat');
      play('reveal');
    }, 1300);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <Modal open={open} onClose={onCancel} width={760} className="cat-modal">
      <div className="col" style={{ alignItems: 'center', gap: '1.1rem', textAlign: 'center' }} data-testid="cat-modal">
        <motion.h2
          className="cat-title"
          initial={{ scale: 0.3, rotate: -12 }}
          animate={{ scale: [0.3, 1.2, 1], rotate: [-12, 6, 0] }}
          transition={{ duration: 0.7 }}
        >
          КОТ В МЕШКЕ!
        </motion.h2>
        <div className="cat-stage">
          <motion.svg
            viewBox="0 0 120 120"
            width="170"
            height="170"
            animate={stage === 'bag' ? { rotate: [0, -8, 8, -6, 6, -3, 3, 0], y: [0, -6, 0, -4, 0] } : { scaleY: 0.85, y: 20 }}
            transition={{ duration: stage === 'bag' ? 1.2 : 0.3 }}
          >
            <path d="M30 40 C10 60 12 110 60 112 C108 110 110 60 90 40Z" fill="#b08850" stroke="#5a3a1c" strokeWidth="4" />
            <path d="M34 42 Q60 30 86 42" stroke="#5a3a1c" strokeWidth="6" fill="none" />
            <path d="M44 38 C40 20 54 18 60 30 C66 18 80 20 76 38" fill="#b08850" stroke="#5a3a1c" strokeWidth="4" />
            <path d="M40 80 Q60 70 80 84 M46 96 Q64 90 78 98" stroke="#8a6534" strokeWidth="3" fill="none" />
            <text x="60" y="85" textAnchor="middle" fontSize="18" fontWeight="900" fill="#5a3a1c">?</text>
          </motion.svg>
          {stage === 'cat' && (
            <motion.div
              className="cat-jump"
              initial={{ y: 60, scale: 0.2, opacity: 0 }}
              animate={{ y: -30, scale: 1, opacity: 1, rotate: [0, -10, 10, 0] }}
              transition={{ type: 'spring', stiffness: 260, damping: 12 }}
            >
              <ArtMedallion art={AVATARS.puss} size={120} />
            </motion.div>
          )}
        </div>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.5, margin: 0 }}>
          {active ? (
            <>
              Команда <b className="gold-text">{active.name}</b> передаёт этот вопрос другой команде.
            </>
          ) : (
            'Выберите команду, которой достанется вопрос.'
          )}
          <br />
          Цена вопроса: <b className="gold-text">{value}</b>
          {doubled && ' (ставка удвоена!)'}
        </p>
        <motion.div
          className="cat-teams"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 'cat' ? 1 : 0.3 }}
          style={{ pointerEvents: stage === 'cat' ? 'auto' : 'none' }}
        >
          {others.map((t, i) => (
            <motion.button
              key={t.id}
              className="cat-team"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.07, y: -4 }}
              onClick={() => onPick(t.id)}
              data-testid={`cat-pick-${t.name}`}
            >
              <Avatar id={t.avatar} size={64} />
              <span>{t.name}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </Modal>
  );
}
