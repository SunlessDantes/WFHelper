import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { withScope } from "./logger";
import { writeFileAtomicSync } from "./atomicFile";
import { normalizeErrorMessage } from "../config/shared/errors";

const log = withScope("endoArenaTracker");


export interface EndoRunRecord {
  id: string; // maybe timestamp as id
  missionNode: "Vodyanoi" | "Arena";
  timestamp: number;
  durationSeconds?: number;
  endoAmount?: number;
  warframe?: string;

}

let _runs: EndoRunRecord[] = [];
let _isInitialized = false;

function getHistoryPath(): string {
  return path.join(app.getPath("userData"), "endo-arena-runs.json");
}

function saveRuns(): void {
  try {
    writeFileAtomicSync(getHistoryPath(), JSON.stringify(_runs, null, 2));
  } catch (err) {
    log.error("Failed to save endo arena runs:", normalizeErrorMessage(err));
  }
}

function loadRuns(): void {
  if (_isInitialized) return;
  try {
    const raw = fs.readFileSync(getHistoryPath(), "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      _runs = parsed;
      log.info(`Loaded ${_runs.length} endo arena runs from disk.`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
      log.error("Failed to load endo arena runs:", normalizeErrorMessage(err));
    }
  }
  _isInitialized = true;
}

export function onArenaMissionEnd(): void {
  log.info("temp");
  // ocr logic here ig (call ocr service + parse results)
  // read warframe from elog
  // create new `EndoArenaRunRecord`
  const newRun: EndoRunRecord = {
    id: `run_${Date.now()}`,
    missionNode: "Vodyanoi",
    timestamp: Date.now(),
    durationSeconds: 65, //
    endoAmount: 3450, //
    warframe: "Khora", //
  };
//above is example run

  addRun(newRun);

  // somewhere here i gotta let UI know that there is a new run record through an ipc channel
}

export function getRuns(): EndoRunRecord[] {
  loadRuns();
  return _runs;
}

export function addRun(run: EndoRunRecord): void {
  loadRuns();
  if (!_runs.some((r) => r.id === run.id)) {
    _runs.push(run);
    _runs.sort((a, b) => b.timestamp - a.timestamp); // sort by newest ts
    saveRuns();
    log.info(`Saved new arena run ${run.id}`);
  }
}

export function deleteRun(runId: string): void {
  loadRuns();
  const initialCount = _runs.length;
  _runs = _runs.filter((r) => r.id !== runId);
  if (_runs.length < initialCount) {
    saveRuns();
    log.info(`Deleted arena run ${runId}`);
  }
}

