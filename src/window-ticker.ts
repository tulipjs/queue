import {
  OnWindowTickFunction,
  WindowTickerConfig,
  WindowTickerMutable,
} from "./types/main.ts";

export const windowTicker = (): WindowTickerMutable => {
  let $loopRunning = false;
  let $loopId: number | undefined = undefined;
  let $fps = 60; // Default FPS
  let $intervalTicks = 1000 / $fps; // Interval in milliseconds per frame
  let $onTick: OnWindowTickFunction | undefined = undefined;
  let $lastTick = performance.now();
  let $tickCount = 0;
  let $lastFPSUpdate = performance.now();
  let $framesThisSecond = 0;
  let $lastNow = performance.now();

  const load = ({ fps }: WindowTickerConfig = {}) => {
    $fps = fps ?? $fps;
    $intervalTicks = 1000 / $fps;
  };

  const pause = () => {
    $loopRunning = false;
    if ($loopId !== undefined) {
      //@ts-ignore
      cancelAnimationFrame($loopId);
    }
  };

  const start = () => {
    $lastTick = performance.now();
    $lastFPSUpdate = performance.now();
    $framesThisSecond = 0;
    $loopRunning = true;
    loop();
  };

  const loop = () => {
    if (!$loopRunning) return;

    const now = performance.now();
    const delta = now - $lastTick;

    if (delta >= $intervalTicks) {
      $lastTick = now - (delta % $intervalTicks);

      const usage = Math.trunc((1 - delta / $intervalTicks) * 100) / 100;

      $framesThisSecond++;

      if (now - $lastFPSUpdate >= 1000) {
        $fps = $framesThisSecond;
        $framesThisSecond = 0;
        $lastFPSUpdate = now;
      }

      const ms = performance.now() - $lastNow;
      if ($onTick)
        $onTick({ delta, ms, usage, tickCount: $tickCount, fps: $fps });
      $tickCount++;
    }

    //@ts-ignore
    $loopId = requestAnimationFrame(loop);
    $lastNow = performance.now();
  };

  const onTick = (onTickCallback: OnWindowTickFunction) =>
    ($onTick = onTickCallback);

  const getFPS = (): number => $fps;

  return {
    load,
    start,
    pause,
    onTick,
    getFPS,
  };
};
