# @oh/queue

The idea is to make a ticker and a queue that works exactly the same between back runtime and web.
Using `setTimeout` on back and `requestAnimationFrame` on the web.

## with web

Add a file `.npmrc` with `@jsr:registry=https://npm.jsr.io`
And add to the `package.json` -> `"@oh/queue": "npm:@jsr/oh__queue@1.0.1"`

```ts
import { queue, windowTicker, TickerQueue, ticker } from "@oh/queue";

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
```

## with deno

`deno add @oh/queue`

```ts
import { queue, ticker, TickerQueue } from "@oh/queue/mod.ts";

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
```
