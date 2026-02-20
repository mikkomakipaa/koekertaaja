export type SpeedQuizGameState = 'intro' | 'playing' | 'results';

export const SPEED_QUIZ_BACK_GUARD_KEY = 'koekertaajaSpeedQuizGuard';

export interface BackNavigationGuardWindow {
  history: Pick<History, 'pushState'>;
  location: Pick<Location, 'href'>;
  addEventListener: (type: 'popstate', listener: () => void) => void;
  removeEventListener: (type: 'popstate', listener: () => void) => void;
}

export function shouldBlockSpeedQuizBackNavigation(state: SpeedQuizGameState): boolean {
  return state === 'playing';
}

export function attachSpeedQuizBackNavigationGuard(
  targetWindow: BackNavigationGuardWindow,
  onBackBlocked?: () => void
): () => void {
  const pushGuardState = () => {
    targetWindow.history.pushState({ [SPEED_QUIZ_BACK_GUARD_KEY]: true }, '', targetWindow.location.href);
  };

  const handlePopState = () => {
    onBackBlocked?.();
    pushGuardState();
  };

  pushGuardState();
  targetWindow.addEventListener('popstate', handlePopState);

  return () => {
    targetWindow.removeEventListener('popstate', handlePopState);
  };
}
