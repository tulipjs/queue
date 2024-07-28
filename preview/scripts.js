import { queue, windowTicker, TickerQueue, ticker } from "./bundle.js";

const $ticker = windowTicker();
const $queue = queue();

$ticker.onTick(({ delta }) => $queue.tick(delta));
$ticker.load({ fps: 60 });
$ticker.start();

const startTime = performance.now();
$queue.add({
  type: TickerQueue.DURATION,
  duration: 5_000,
  onFunc(delta) {
    console.log("onFunc", delta);
  },
  onDone() {
    console.log("onDone", performance.now() - startTime);
  },
});
