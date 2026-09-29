import { useContent } from '../../store/content';
import { useUi } from '../../store/ui';
import { play } from '../../audio/sounds';

/** Вход в режим разработчика: сразу, если пароль не задан или уже введён, иначе — окно пароля */
export function requestDevMode() {
  const ui = useUi.getState();
  if (ui.screen === 'dev') return;
  const password = useContent.getState().game?.settings.devPassword ?? '';
  play('click');
  if (!password || ui.devUnlocked) enterDev();
  else ui.set({ passwordPrompt: true });
}

export function enterDev() {
  useUi.getState().set({ screen: 'dev', devUnlocked: true, passwordPrompt: false, preview: false });
}
