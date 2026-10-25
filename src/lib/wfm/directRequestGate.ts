import { createMinIntervalGate } from "./requestPolicy.js";

/** warframe.market allows 3 requests/second per IP, and the main process spends
 *  its own 2.5 from the same address. Renderer calls that go to WFM directly
 *  share this one gate so parallel order-book loads cannot burst past it. */
export const waitForDirectWfmSlot = createMinIntervalGate(400);
