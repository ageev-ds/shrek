import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Backdrop, Plaque } from '../../components/ui';
import { AVATAR_IDS, AVATARS, Avatar } from '../../components/art';
import { useGame } from '../../store/content';
import { useSession, type DraftTeam } from '../../store/session';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';
import { useHotkey } from '../../hooks/useHotkey';
import { uid } from '../../lib/ids';
import type { AvatarId } from '../../types/game';

const MIN = 2;
const MAX = 6;
const SUGGESTED = ['Болотные огры', 'Ослиная сила', 'Пряничные человечки', 'Рыцари Дюлока', 'Котики в сапогах', 'Драконья гвардия'];

export function TeamSetup() {
  const game = useGame();
  const go = useUi((s) => s.go);
  const preview = useUi((s) => s.preview);
  const startGame = useSession((s) => s.startGame);
  const sessionTeams = useSession((s) => s.teams);

  const [teams, setTeams] = useState<DraftTeam[]>(() => {
    if (sessionTeams.length) return sessionTeams.map(({ id, name, avatar }) => ({ id, name, avatar }));
    return game.defaultTeams.slice(0, MAX).map((t) => ({ id: uid('team'), name: t.name, avatar: t.avatar }));
  });
  const usedAvatars = new Set(teams.map((t) => t.avatar));
  const firstFree = AVATAR_IDS.find((a) => !usedAvatars.has(a)) ?? 'shrek';
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>(firstFree);

  useHotkey('escape', () => go('start'));

  const add = () => {
    if (teams.length >= MAX) return;
    const finalName = name.trim() || SUGGESTED.find((s) => !teams.some((t) => t.name === s)) || `Команда ${teams.length + 1}`;
    const next = [...teams, { id: uid('team'), name: finalName, avatar }];
    setTeams(next);
    setName('');
    const used = new Set(next.map((t) => t.avatar));
    setAvatar(AVATAR_IDS.find((a) => !used.has(a)) ?? avatar);
    play('add');
  };

  const canStart = teams.length >= MIN;

  return (
    <div className="screen teams-screen">
      <Backdrop slot="menu" />
      <div className="teams-layout">
        <motion.header className="teams-header" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <button className="btn wood-btn small" onClick={() => go('start')}>
            ← Назад
          </button>
          <Plaque className="teams-title">Кто сегодня играет?</Plaque>
          <span className="muted">
            {teams.length} / {MAX} команд
          </span>
        </motion.header>

        <div className="teams-main">
          <motion.div className="team-form wood rivets" initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="gold-text">Новая команда</h2>
            <label className="field">
              <span>Название команды</span>
              <input
                className="input"
                value={name}
                maxLength={28}
                placeholder={SUGGESTED[teams.length % SUGGESTED.length]}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                data-testid="team-name"
              />
            </label>
            <div className="field">
              <span>Персонаж: {AVATARS[avatar].name}</span>
              <div className="avatar-grid">
                {AVATAR_IDS.map((a) => (
                  <motion.button
                    key={a}
                    className={`avatar-pick ${a === avatar ? 'on' : ''} ${usedAvatars.has(a) ? 'used' : ''}`}
                    whileHover={{ scale: 1.12, rotate: -4 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      play('click');
                      setAvatar(a);
                    }}
                    title={AVATARS[a].name}
                    data-testid={`avatar-${a}`}
                  >
                    <Avatar id={a} size={58} />
                  </motion.button>
                ))}
              </div>
            </div>
            <button className="btn green" onClick={add} disabled={teams.length >= MAX} data-testid="btn-add-team">
              ＋ Добавить команду
            </button>
          </motion.div>

          <div className="team-list">
            <AnimatePresence>
              {teams.length === 0 && (
                <motion.div className="team-empty muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Добавьте хотя бы две команды — и в путь, на болото!
                </motion.div>
              )}
              {teams.map((t, i) => (
                <motion.div
                  key={t.id}
                  layout
                  className="team-card wood"
                  initial={{ opacity: 0, scale: 0.4, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  data-testid="team-card"
                >
                  <span className="team-num">{i + 1}</span>
                  <Avatar id={t.avatar} size={84} />
                  <input
                    className="team-rename"
                    value={t.name}
                    maxLength={28}
                    onChange={(e) => setTeams(teams.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
                    onBlur={() => setTeams(teams.map((x) => (x.id === t.id && !x.name.trim() ? { ...x, name: `Команда ${i + 1}` } : x)))}
                    title="Нажмите, чтобы переименовать"
                  />
                  <span className="muted team-avatar-name">{AVATARS[t.avatar].name}</span>
                  <button
                    className="icon-btn danger team-remove"
                    onClick={() => {
                      play('remove');
                      setTeams(teams.filter((x) => x.id !== t.id));
                    }}
                    title="Удалить команду"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <motion.footer className="teams-footer" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          {!canStart && <span className="muted">Нужно минимум {MIN} команды</span>}
          <motion.button
            className="btn big"
            disabled={!canStart}
            animate={canStart ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={canStart ? { repeat: Infinity, duration: 1.8 } : undefined}
            onClick={() => {
              play('open');
              startGame(teams, game);
              go('board');
            }}
            data-testid="btn-start-game"
          >
            🏁 Начать игру
          </motion.button>
          {preview && <span className="badge gold">Предпросмотр</span>}
        </motion.footer>
      </div>
    </div>
  );
}
