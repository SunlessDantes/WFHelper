import { onAuthorized, assertMainWindowWebContentsSender } from "./ipcSecurity";
import { ENDO_GET_RUNS, ENDO_DELETE_RUN } from "../config/shared/ipcChannels";
import * as endoArenaTracker from "../services/endoRunTracker";

export function register(): void {

  onAuthorized(ENDO_GET_RUNS, assertMainWindowWebContentsSender, async () => {
    return endoArenaTracker.getRuns();
  });


  onAuthorized(
    ENDO_DELETE_RUN,
    assertMainWindowWebContentsSender,
    (_event, runId: unknown) => {
      if (typeof runId === "string") {
        endoArenaTracker.deleteRun(runId);
      }
    },
  );
}
