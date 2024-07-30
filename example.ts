import { queue, TickerQueue, ticker } from "./index.ts";

const $ticker = ticker();
const $queue = queue({
  onResume: $ticker.start,
  onPause: $ticker.pause,
});

$ticker.onTick(({ delta }) => $queue.tick(delta));
$ticker.load({ ticks: 20 });

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
