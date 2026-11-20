// The trade confirmation dialog, announced once while the player can still
// decline it, so a check can warn before the trade goes through.

import type { ParsedLogTrade } from "./eeLogMonitor";

// Each dialog gets a number; a listener's work is stale once that dialog settled
// or a newer one opened.
let dialogListener: ((trade: ParsedLogTrade, dialog: number) => void) | null = null;
let announcedBuffer: string[] | null = null;
let dialogNumber = 0;
let dialogOpen = false;

// DBWIN delivers the dialog live and the file poll re-delivers it up to ~26 s
// later; the echo is the same dialog, not a new one to warn about.
const ECHO_WINDOW_MS = 30_000;
let lastDialog: { content: string; stamp: string | null; at: number } | null = null;

function dialogContent(trade: ParsedLogTrade): string {
  const items = trade.items.map((i) => `${i.direction}:${i.displayName}:${i.count}`).sort();
  return [trade.type, trade.platChange, trade.partner.toLowerCase(), ...items].join("|");
}

function isEcho(trade: ParsedLogTrade, now: number): boolean {
  if (!lastDialog || lastDialog.content !== dialogContent(trade)) return false;
  const stamp = trade.logStamp ?? null;
  if (stamp !== null && lastDialog.stamp !== null) return stamp === lastDialog.stamp;
  return now - lastDialog.at <= ECHO_WINDOW_MS;
}

export function onTradeDialogOpen(
  listener: ((trade: ParsedLogTrade, dialog: number) => void) | null,
): void {
  dialogListener = listener;
}

/** Called on every log line while a sealed dialog is buffered; each buffer is
 *  a new dialog unless it echoes the last one, so it is announced once. */
export function announceTradeDialog(buffer: string[], parse: () => ParsedLogTrade | null): void {
  if (buffer === announcedBuffer) return;
  announcedBuffer = buffer;
  const trade = parse();
  const now = Date.now();
  if (trade && isEcho(trade, now)) return;
  if (trade) lastDialog = { content: dialogContent(trade), stamp: trade.logStamp ?? null, at: now };
  dialogNumber += 1;
  dialogOpen = true;
  if (trade && dialogListener) dialogListener(trade, dialogNumber);
}

/** The trade went through: the dialog's warning would now be too late. */
export function settleTradeDialog(): void {
  dialogOpen = false;
}

export function isTradeDialogPending(dialog: number): boolean {
  return dialogOpen && dialog === dialogNumber;
}
