export const OPEN_GET_QUICK_WINS_EVENT = "build-me:open-get-quick-wins";

export function openGetQuickWins(): void {
  window.dispatchEvent(new Event(OPEN_GET_QUICK_WINS_EVENT));
}