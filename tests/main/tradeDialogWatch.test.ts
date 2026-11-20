import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  _parseTradeDialog,
  forceEeLogPoll,
  startWatching,
  stopWatching,
} from "../../services/eeLogMonitor";
import {
  announceTradeDialog,
  isTradeDialogPending,
  onTradeDialogOpen,
  settleTradeDialog,
} from "../../services/tradeDialogWatch";

const hoisted = vi.hoisted(() => ({ logPath: "" }));

vi.mock("chokidar", () => ({
  default: { watch: () => ({ on: () => undefined, close: () => undefined }) },
}));

vi.mock("../../services/eeLogPath", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/eeLogPath")>()),
  resolveEeLogPath: () => hoisted.logPath,
}));

vi.mock("../../services/dbwinMonitor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/dbwinMonitor")>()),
  isDbwinActive: () => false,
  startDbwinWorker: () => undefined,
  stopDbwinWorker: () => undefined,
}));

const TAIL = ", title= leftItem=/Menu/Confirm_Item_Ok, rightItem=/Menu/Confirm_Item_Cancel)";

function saleDialog(stamp: string, item: string, partner: string, platinum: number): string[] {
  return [
    `${stamp} Script [Info]: Dialog.lua: Dialog::CreateOkCancel(description=` +
      "Are you sure you want to accept this trade? You are offering:",
    `\r${item}`,
    "",
    `and will receive from ${partner} the following:`,
    `\rPlatinum x ${platinum}${TAIL}`,
  ];
}

function success(stamp: string): string[] {
  return [
    `${stamp} Script [Info]: Dialog.lua: SendResult_MENU_SELECT()`,
    `${stamp} Script [Info]: Dialog.lua: Dialog::CreateOk(description=The trade was successful!` +
      ", title= leftItem=/Menu/Confirm_Item_Ok)",
  ];
}

describe("trade dialog announcement", () => {
  let tmpDir = "";

  function append(lines: string[]): void {
    fs.appendFileSync(hoisted.logPath, lines.join("\n") + "\n");
    forceEeLogPoll();
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wfhelper-trade-dialog-"));
    hoisted.logPath = path.join(tmpDir, "EE.log");
    fs.writeFileSync(hoisted.logPath, "");
    vi.useFakeTimers();
    startWatching({});
  });

  afterEach(() => {
    onTradeDialogOpen(null);
    stopWatching();
    vi.useRealTimers();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("announces the dialog once before the trade goes through", () => {
    const seen: Array<{ plat: number; dialog: number }> = [];
    onTradeDialogOpen((trade, dialog) => seen.push({ plat: trade.platChange, dialog }));

    append(saleDialog("785.651", "Vital Sense (RARE RANK 0)", "BuyerOne", 5));
    expect(seen.map((entry) => entry.plat)).toEqual([5]);
    expect(isTradeDialogPending(seen[0].dialog)).toBe(true);

    append([
      ...success("789.030"),
      ...saleDialog("983.281", "Protea Prime Blueprint", "BuyerTwo", 10),
      ...success("989.002"),
    ]);
    expect(seen.map((entry) => entry.plat)).toEqual([5, 10]);
    // Both went through, so neither warning would still be in time.
    expect(isTradeDialogPending(seen[0].dialog)).toBe(false);
    expect(isTradeDialogPending(seen[1].dialog)).toBe(false);
  });
});

describe("trade dialog echoes", () => {
  afterEach(() => onTradeDialogOpen(null));

  // Each test opens its own dialog: the echo memory is module state.
  const dialogAt = (stamp: string) => saleDialog(stamp, "Vital Sense (RARE RANK 0)", "Buyer", 5);
  const announce = (buffer: string[]) =>
    announceTradeDialog(buffer, () => _parseTradeDialog(buffer));

  // DBWIN delivers the dialog live; the file poll re-delivers it seconds later.
  it("does not warn twice for one dialog read from both sources", () => {
    const seen: number[] = [];
    onTradeDialogOpen((_trade, dialog) => seen.push(dialog));

    announce(dialogAt("2001.000"));
    announce(dialogAt("2001.000"));

    expect(seen).toHaveLength(1);
    expect(isTradeDialogPending(seen[0])).toBe(true);
  });

  it("keeps a settled trade settled when its file echo arrives", () => {
    const seen: number[] = [];
    onTradeDialogOpen((_trade, dialog) => seen.push(dialog));

    announce(dialogAt("2002.000"));
    settleTradeDialog();
    announce(dialogAt("2002.000"));

    expect(seen).toHaveLength(1);
    expect(isTradeDialogPending(seen[0])).toBe(false);
  });

  it("warns again when the same offer is made in a new dialog", () => {
    const seen: number[] = [];
    onTradeDialogOpen((_trade, dialog) => seen.push(dialog));

    announce(dialogAt("2003.000"));
    announce(dialogAt("2190.000"));

    expect(seen).toHaveLength(2);
  });
});
