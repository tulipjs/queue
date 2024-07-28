import type { OnTickFunction, TickerConfig } from "./types/main.ts";
import { TickerMutable } from "./types/main.ts";

export const ticker = (): TickerMutable => {
  let $loopRunning = false;
  let $loopId: number | undefined = undefined;
  let $ticks = 60;
  let $intervalTicks = 1000 / $ticks;
  let $onTick: OnTickFunction | undefined = undefined;
  let $lastTick = performance.now();
  let $idealTick = performance.now();
  let $tickCount = 0;
  let $lastNow = performance.now();

  const load = ({ ticks }: TickerConfig = {}) => {
    $ticks = ticks ?? $ticks;
    $intervalTicks = 1000 / $ticks;
  };

  const pause = () => {
    clearTimeout($loopId);
    $loopRunning = false;
  };

  const start = () => {
    $lastTick = performance.now();
    $idealTick = performance.now();
    $loopRunning = true;
    loop();
  };

  const loop = () => {
    const now = performance.now();
    const delta = now - $lastTick;

    if (delta > $intervalTicks) $lastTick = now - (delta % $intervalTicks);

    $idealTick += $intervalTicks;
    const nextTick = Math.max(0, $idealTick - performance.now());

    const ms = performance.now() - $lastNow;
    const usage = Math.trunc((1 - nextTick / $intervalTicks) * 100) / 100;
    if ($onTick) $onTick({ delta, ms, usage, tickCount: $tickCount });

    $tickCount++;

    if (!$loopRunning) return;
    $loopId = setTimeout(loop, nextTick);
    $lastNow = performance.now();
  };

  const onTick = (onTickCallback: OnTickFunction) => ($onTick = onTickCallback);

  const getTicks = (): number => $ticks;

  return {
    load,

    start,
    pause,

    onTick,
    getTicks,
  };
};
