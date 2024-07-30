import { queue, windowTicker, TickerQueue } from "./bundle.js";

const $ticker = windowTicker();
const $queue = queue({
  onResume: $ticker.start,
  onPause: $ticker.pause,
});
// Ticker.shared.add((time) => $queue.tick(time.deltaTime));
$ticker.onTick(({ delta }) => $queue.tick(delta));

const startTime = performance.now();
let a = performance.now();
$queue.add({
  type: TickerQueue.REPEAT,
  repeatEvery: 1000 / 10,
  repeats: 10,
  onFunc(delta) {
    console.log("onFunc", delta, a - performance.now());
    a = performance.now();
  },
  onDone() {
    console.log("onDone", performance.now() - startTime);
  },
});
