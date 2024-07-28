import { queue, ticker, TickerQueue } from "./mod.ts";

const $ticker = ticker();
const $queue = queue();

$ticker.onTick(({ delta }) => $queue.tick(delta));
$ticker.load({ ticks: 60 });
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
