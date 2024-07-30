// src/enums/ticker-queue.enum.ts
var TickerQueue = /* @__PURE__ */ ((TickerQueue2) => {
  TickerQueue2[(TickerQueue2["DELAY"] = 0)] = "DELAY";
  TickerQueue2[(TickerQueue2["DURATION"] = 1)] = "DURATION";
  TickerQueue2[(TickerQueue2["REPEAT"] = 2)] = "REPEAT";
  TickerQueue2[(TickerQueue2["CUSTOM"] = 3)] = "CUSTOM";
  return TickerQueue2;
})(TickerQueue || {});

// src/queue.ts
var queue = (queueProps = {}) => {
  let $lastId = 0;
  let $queueList = [];
  let $queueIdToDelete = [];
  let isActive = false;
  const $resume = () => {
    if (isActive) return;
    isActive = true;
    queueProps?.onResume?.();
  };
  const $pause = () => {
    if (!isActive) return;
    isActive = false;
    queueProps?.onPause?.();
  };
  const $queueMap = {
    //@ts-ignore
    [0 /* DELAY */]: (item, delta) => {
      item.accDelta += delta;
      const isDone = item.accDelta >= item.delay;
      if (isDone && item.onFunc) item.onFunc(delta);
      if (isDone && item.onDone) item.onDone();
      return isDone;
    },
    //@ts-ignore
    [1 /* DURATION */]: (item, delta) => {
      item.accDelta += delta;
      const isDone = item.accDelta >= item.duration;
      if (!isDone && item.onFunc) item.onFunc(delta);
      if (isDone && item.onDone) item.onDone();
      return isDone;
    },
    //@ts-ignore
    [2 /* REPEAT */]: (item, delta) => {
      if (0 >= item.repeats && item.repeats !== void 0) {
        if (item.onDone) item.onDone();
        return true;
      }
      item.accDelta += delta;
      if (item.accDelta < item.repeatEvery) return false;
      if (item.onFunc) item.onFunc(delta);
      item.accDelta = 0;
      if (item.repeats !== void 0) item.repeats -= 1;
      if (item.repeats === 0) {
        if (item.onDone) item.onDone();
        return true;
      }
      return false;
    },
    //@ts-ignore
    [3 /* CUSTOM */]: ({ onFunc }, delta) =>
      //@ts-ignore
      onFunc && Boolean(onFunc(delta)),
  };
  const tick = (delta) => {
    if (!isActive) return;
    removeQueueList();
    let index = 0;
    for (const queueItem of $queueList) {
      if (!queueItem) return;
      const isReadyToBeDeleted = $queueMap[queueItem.type](
        queueItem,
        delta,
        index,
      );
      if (isReadyToBeDeleted) $queueIdToDelete.push(queueItem.id);
      index++;
    }
    if (!$queueList.length && !$queueIdToDelete.length) $pause();
  };
  const removeQueueList = () => {
    if (!$queueIdToDelete.length) return;
    $queueList = $queueList.filter(
      (queue2) => queue2 && !$queueIdToDelete.includes(queue2.id),
    );
    $queueIdToDelete = [];
  };
  const getQueueId = () => $lastId++;
  const add = (props) => {
    const id = getQueueId();
    $queueList.push({
      ...props,
      id,
      accDelta: 0,
    });
    $resume();
    return id;
  };
  const addAsync = (queueItem) =>
    new Promise((resolve) => {
      const id = getQueueId();
      queueItem.onDone = () => {
        resolve(1);
      };
      $queueList.push({
        ...queueItem,
        id,
        accDelta: 0,
      });
      $resume();
      return id;
    });
  const remove = (id) => $queueIdToDelete.push(id);
  const addList = (list, onDone) => {
    const clonedList = [...list];
    if (clonedList.length === 0) return onDone && onDone();
    const object = clonedList.shift();
    if (!object) return onDone && onDone();
    add({
      ...object,
      onDone: () => {
        object.onDone && object.onDone();
        addList(clonedList, onDone);
      },
    });
  };
  return {
    add,
    addAsync,
    remove,
    tick,
  };
};

// src/ticker.ts
var ticker = () => {
  let $loopRunning = false;
  let $loopId = void 0;
  let $ticks;
  let $intervalTicks;
  let $onTick = void 0;
  let $lastTick = performance.now();
  let $tickCount = 0;
  let $lastNow = performance.now();
  const load = ({ ticks } = {}) => {
    $ticks = ticks ?? null;
    if ($ticks) $intervalTicks = 1e3 / $ticks;
  };
  const pause = () => {
    clearTimeout($loopId);
    $loopRunning = false;
  };
  const start = () => {
    $lastTick = performance.now();
    $loopRunning = true;
    loop();
  };
  const loop = () => {
    const now = performance.now();
    const delta = now - $lastTick;
    if ($intervalTicks && delta > $intervalTicks)
      $lastTick = now - (delta % $intervalTicks);
    const ms = performance.now() - $lastNow;
    const usage = $intervalTicks
      ? Math.trunc((delta / $intervalTicks) * 100) / 100
      : null;
    $onTick && $onTick({ delta, ms, usage, tickCount: $tickCount });
    $tickCount++;
    if (!$loopRunning) return;
    $loopId = $intervalTicks
      ? setTimeout(loop, $intervalTicks)
      : setTimeout(loop);
    $lastTick = now;
    $lastNow = performance.now();
  };
  const onTick = (onTickCallback) => ($onTick = onTickCallback);
  const getTicks = () => $ticks;
  return {
    load,
    start,
    pause,
    onTick,
    getTicks,
  };
};

// src/window-ticker.ts
var windowTicker = () => {
  let $loopRunning = false;
  let $loopId = void 0;
  let $fps = 0;
  let $onTick = void 0;
  let $tickCount = 0;
  let $lastFPSUpdate = 0;
  let $framesThisSecond = 0;
  let $lastNow = 0;
  const pause = () => {
    $loopRunning = false;
    if ($loopId !== void 0) {
      cancelAnimationFrame($loopId);
    }
  };
  const start = () => {
    $lastFPSUpdate = 0;
    $framesThisSecond = 0;
    $loopRunning = true;
    $loopId = requestAnimationFrame(loop);
  };
  const loop = (now) => {
    if (!$loopRunning) return;
    if ($lastNow === 0) $lastNow = now;
    const delta = now - $lastNow;
    $lastNow = now;
    $framesThisSecond++;
    $lastFPSUpdate += delta;
    if ($lastFPSUpdate >= 1e3) {
      $fps = $framesThisSecond;
      $framesThisSecond = 0;
      $lastFPSUpdate = 0;
    }
    $onTick && $onTick({ delta, tickCount: $tickCount, fps: $fps });
    $tickCount++;
    $loopId = requestAnimationFrame(loop);
  };
  const onTick = (onTickCallback) => ($onTick = onTickCallback);
  const getFPS = () => $fps;
  return {
    start,
    pause,
    onTick,
    getFPS,
  };
};
export { TickerQueue, queue, ticker, windowTicker };
