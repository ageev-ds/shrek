import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Modal } from '../../components/ui';
import { AVATAR_IDS, AVATARS, Avatar } from '../../components/art';
import { useContent, useGame } from '../../store/content';
import { play } from '../../audio/sounds';
import type { AvatarId } from '../../types/game';

export function TeamsEditor() {
  const game = useGame();
  const update = useContent((s) => s.update);
  const [pickFor, setPickFor] = useState<number | null>(null);
  const teams = game.defaultTeams;

  return (
    <div className="dev-panel">
      <div className="dev-panel-head">
        <div>
          <h2>Команды по умолчанию</h2>
          <p className="muted">Эти команды сразу появятся на экране подготовки. Оставьте список пустым, чтобы игроки вводили команды сами.</p>
        </div>
        <div className="row">
          <button
            className="btn small red"
            disabled={!teams.length}
            onClick={() => {
              play('remove');
              update((g) => {
                g.defaultTeams = [];
              });
            }}
          >
            Очистить
          </button>
          <button
            className="btn small green"
            disabled={teams.length >= 6}
            onClick={() => {
              play('add');
              update((g) => {
                const used = new Set(g.defaultTeams.map((t) => t.avatar));
                g.defaultTeams.push({ name: `Команда ${g.defaultTeams.length + 1}`, avatar: AVATAR_IDS.find((a) => !used.has(a)) ?? 'shrek' });
              });
            }}
            data-testid="btn-add-default-team"
          >
            ＋ Добавить
          </button>
        </div>
      </div>
      <div className="default-teams">
        {teams.length === 0 && <p className="muted">Список пуст — команды вводятся перед игрой.</p>}
        <AnimatePresence>
          {teams.map((t, i) => (
            <motion.div key={i} className="default-team" layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button className="avatar-pick" onClick={() => setPickFor(i)} title="Сменить персонажа">
                <Avatar id={t.avatar} size={56} />
              </button>
              <input
                className="input"
                value={t.name}
                maxLength={28}
                onChange={(e) =>
                  update((g) => {
                    g.defaultTeams[i].name = e.target.value;
                  })
                }
              />
              <button
                className="icon-btn danger"
                onClick={() => {
                  play('remove');
                  update((g) => {
                    g.defaultTeams.splice(i, 1);
                  });
                }}
              >
                🗑
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Modal open={pickFor !== null} onClose={() => setPickFor(null)} width={640}>
        <div className="col">
          <h3 className="gold-text">Персонаж команды</h3>
          <div className="avatar-grid">
            {AVATAR_IDS.map((a: AvatarId) => (
              <button
                key={a}
                className="avatar-pick"
                title={AVATARS[a].name}
                onClick={() => {
                  update((g) => {
                    g.defaultTeams[pickFor!].avatar = a;
                  });
                  setPickFor(null);
                }}
              >
                <Avatar id={a} size={64} />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
