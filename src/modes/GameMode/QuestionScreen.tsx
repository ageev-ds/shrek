import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useGame } from '../../store/content';
import { findQuestion, useSession } from '../../store/session';
import { Timer } from '../../components/Timer';
import { Avatar, QuestionImage } from '../../components/art';
import { Backdrop } from '../../components/ui';
import { play } from '../../audio/sounds';
import { useHotkey } from '../../hooks/useHotkey';
import { cellKey } from '../../lib/ids';
import { CatInBagModal } from './CatInBagModal';
import { AuctionModal } from './AuctionModal';

export function QuestionScreen() {
  const game = useGame();
  // Во время анимации закрытия current уже null — показываем последний открытый вопрос
  const live = useSession((s) => s.current);
  const last = useRef(live);
  if (live) last.current = live;
  const current = last.current!;
  const teams = useSession((s) => s.teams);
  const { setAnswering, reveal, judge, close } = useSession.getState();
  const [timerRun, setTimerRun] = useState(0);

  const category = game.categories.find((c) => c.id === current.categoryId)!;
  const q = findQuestion(game, current.categoryId, current.levelId, current.questionId)!;
  const key = cellKey(current.categoryId, current.levelId);
  const answering = teams.find((t) => t.id === current.answeringTeamId) ?? null;
  const winner = teams.find((t) => t.id === current.winnerId) ?? null;
  const judgedHere = current.tried.length > 0 || current.resolved;
  const needsCatChoice = current.kind === 'cat' && !answering && current.tried.length === 0 && !current.resolved;
  const needsAuction = current.kind === 'auction' && !answering && current.tried.length === 0 && !current.resolved;
  const questionVisible = !needsCatChoice && !needsAuction;
  const nextCandidates = current.kind === 'normal' ? teams.filter((t) => !current.tried.includes(t.id)) : [];
  const awaitingNext = !answering && !current.resolved && questionVisible;
  const noRisk = q.noRisk || !game.settings.wrongAnswerPenalty;

  const timerSec =
    q.timerSec ??
    (current.kind === 'cat' ? game.settings.catInBagTimerSec : current.kind === 'auction' ? game.settings.auctionTimerSec : game.settings.defaultTimerSec);
  const timerActive = questionVisible && !!answering && !current.revealed && !current.resolved;

  const doReveal = () => {
    if (current.revealed) return;
    play('reveal');
    reveal();
  };
  const onCorrect = () => {
    if (!answering || current.resolved) return;
    play('correct');
    judge(true, game);
  };
  const onWrong = () => {
    if (!answering || current.resolved) return;
    play('wrong');
    judge(false, game);
  };
  const back = (markPlayed: boolean) => {
    play('click');
    close(markPlayed);
  };

  useHotkey('space', doReveal, questionVisible);
  useHotkey(
    'escape',
    () => {
      if (current.resolved || current.revealed || judgedHere) back(true);
      else back(false);
    },
    questionVisible,
  );

  return (
    <motion.div className="question-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="question-screen">
      <Backdrop slot="question" parallax={false} fireflies={false} />
      <motion.div
        layoutId={`cell-${key}`}
        className={`question-card wood rivets kind-${current.kind}`}
        style={{ ['--cat' as string]: category.color }}
        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      >
        <header className="q-header">
          <div className="q-cat">
            <span>{category.emoji}</span> {category.title}
          </div>
          <div className="q-badges">
            {current.kind === 'cat' && <span className="badge gold">🐱 Кот в мешке{q.doubleStake ? ' · ставка ×2' : ''}</span>}
            {current.kind === 'auction' && <span className="badge gold">🔨 Аукцион</span>}
            {q.noRisk && <span className="badge">🛡 Без риска</span>}
          </div>
          <div className="q-value" data-testid="q-value">
            {current.value}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {answering && !current.resolved && (
            <motion.div
              key={answering.id}
              className="q-answering"
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              data-testid="q-answering"
            >
              <Avatar id={answering.avatar} size={40} /> Отвечает: <b>{answering.name}</b>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="q-body">
          {questionVisible ? (
            <motion.div className="q-text-wrap" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
              {q.image && (
                <div className="q-image">
                  <QuestionImage src={q.image} size={220} />
                </div>
              )}
              <p className="q-text" data-testid="q-text">
                {q.text}
              </p>
            </motion.div>
          ) : (
            <div className="q-hidden muted">Вопрос откроется после выбора отвечающей команды…</div>
          )}

          <AnimatePresence>
            {current.revealed && (
              <motion.div
                className="q-answer parchment"
                initial={{ opacity: 0, rotateX: -90, y: 30 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                data-testid="q-answer"
              >
                <span className="q-answer-label">Ответ</span>
                {q.answer}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {winner && (
              <motion.div className="q-winner" initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
                <Avatar id={winner.avatar} size={52} /> <b>{winner.name}</b> получает <span className="gold-text">+{current.value}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="q-footer">
          <div className="q-timer-slot">
            {questionVisible && answering && !current.resolved && (
              <Timer key={`${answering.id}-${timerRun}`} seconds={timerSec} running={timerActive} onExpire={doReveal} size={104} />
            )}
          </div>

          <div className="q-actions">
            {awaitingNext && (
              <div className="q-next">
                {nextCandidates.length > 0 ? (
                  <>
                    <span className="muted">
                      {noRisk ? 'Неверно (без штрафа).' : 'Неверно.'} Кто отвечает следующим?
                    </span>
                    <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                      {nextCandidates.map((t) => (
                        <button
                          key={t.id}
                          className="btn small wood-btn"
                          onClick={() => {
                            play('click');
                            setAnswering(t.id);
                            setTimerRun((n) => n + 1);
                          }}
                          data-testid={`next-${t.name}`}
                        >
                          <Avatar id={t.avatar} size={26} /> {t.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="muted">Больше никто не отвечает.</span>
                )}
              </div>
            )}

            {questionVisible && !current.resolved && answering && (
              <>
                <button className="btn green" onClick={onCorrect} data-testid="btn-correct">
                  ✔ Верно
                </button>
                <button className="btn red" onClick={onWrong} data-testid="btn-wrong">
                  ✘ Неверно
                </button>
              </>
            )}
            {questionVisible && !current.revealed && (
              <button className="btn" onClick={doReveal} data-testid="btn-reveal">
                👁 Показать ответ <kbd>Пробел</kbd>
              </button>
            )}
          </div>

          <div className="q-back">
            {current.resolved || current.revealed || judgedHere ? (
              <button className="btn wood-btn" onClick={() => back(true)} data-testid="btn-to-board">
                ← К полю
              </button>
            ) : (
              <button className="btn ghost small" onClick={() => back(false)} title="Клетка останется несыгранной" data-testid="btn-cancel">
                ↶ Вернуться к полю <kbd>Esc</kbd>
              </button>
            )}
          </div>
        </footer>
      </motion.div>

      <CatInBagModal
        open={needsCatChoice}
        value={current.value}
        doubled={!!q.doubleStake}
        onPick={(teamId) => {
          play('click');
          setAnswering(teamId);
        }}
        onCancel={() => back(false)}
      />
      <AuctionModal
        open={needsAuction}
        baseValue={current.value}
        onDone={(teamId, bid) => {
          play('auction');
          setAnswering(teamId, bid);
        }}
        onCancel={() => back(false)}
      />
    </motion.div>
  );
}
