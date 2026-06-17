/**
 * MAQAM v4.0 - Scheduler Worker
 * Provides high-precision ticking for the FlowDispatcher.
 */

let timerID = null;
let interval = 25;

self.onmessage = (e) => {
  if (e.data.action === "START") {
    timerID = setInterval(() => {
      postMessage("TICK");
    }, interval);
  } else if (e.data.action === "STOP") {
    clearInterval(timerID);
    timerID = null;
  } else if (e.data.action === "SET_INTERVAL") {
    interval = e.data.interval;
    if (timerID) {
      clearInterval(timerID);
      timerID = setInterval(() => {
        postMessage("TICK");
      }, interval);
    }
  }
};
