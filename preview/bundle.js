// src/enums/ticker-queue.enum.ts
var TickerQueue = /* @__PURE__ */ ((TickerQueue2) => {
  TickerQueue2[(TickerQueue2["DELAY"] = 0)] = "DELAY";
  TickerQueue2[(TickerQueue2["DURATION"] = 1)] = "DURATION";
  TickerQueue2[(TickerQueue2["REPEAT"] = 2)] = "REPEAT";
  TickerQueue2[(TickerQueue2["CUSTOM"] = 3)] = "CUSTOM";
  return TickerQueue2;
})(TickerQueue || {});

// src/queue.ts
var queue = () => {
  let $lastId = 0;
  let $queueList = [];
  let $queueIdToDelete = [];
  const $queueMap = {
    //@ts-ignore
    [0 /* DELAY */]: ({ startTime, delay, onFunc, onDone }, delta) => {
      const isDone = performance.now() > startTime + delay;
      if (isDone && onFunc) onFunc(delta);
      if (isDone && onDone) onDone();
      return isDone;
    },
    //@ts-ignore
    [1 /* DURATION */]: ({ startTime, duration, onFunc, onDone }, delta) => {
      const isDone = performance.now() > startTime + duration;
      if (!isDone && onFunc) onFunc(delta);
      if (isDone && onDone) onDone();
      return isDone;
    },
    //@ts-ignore
    [2 /* REPEAT */]: (
      { startTime, repeatEvery, onFunc, repeats, onDone },
      delta,
      index,
    ) => {
      if (0 >= repeats && repeats !== void 0) {
        onDone && onDone();
        return true;
      }
      if (!(performance.now() > startTime + repeatEvery)) return false;
      onFunc && onFunc(delta);
      $queueList[index].startTime = performance.now();
      if (repeats !== void 0) $queueList[index]["repeats"] = repeats - 1;
      return false;
    },
    //@ts-ignore
    [3 /* CUSTOM */]: ({ onFunc }, delta) =>
      //@ts-ignore
      onFunc && Boolean(onFunc(delta)),
  };
  const tick = (delta) => {
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
      startTime: props.startTime ?? performance.now(),
    });
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
        startTime: queueItem.startTime ?? performance.now(),
      });
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
  let $ticks = 60;
  let $intervalTicks = 1e3 / $ticks;
  let $onTick = void 0;
  let $lastTick = performance.now();
  let $idealTick = performance.now();
  let $tickCount = 0;
  const load = ({ ticks } = {}) => {
    $ticks = ticks ?? $ticks;
    $intervalTicks = 1e3 / $ticks;
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
    const deltaTime = now - $lastTick;
    if (deltaTime > $intervalTicks)
      $lastTick = now - (deltaTime % $intervalTicks);
    $idealTick += $intervalTicks;
    const nextTick = Math.max(0, $idealTick - performance.now());
    const delta = performance.now() - now;
    const usage = Math.trunc((1 - nextTick / $intervalTicks) * 100) / 100;
    if ($onTick) $onTick({ delta, usage, tickCount: $tickCount });
    $tickCount++;
    if (!$loopRunning) return;
    $loopId = setTimeout(loop, nextTick);
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
  let $fps = 60;
  let $intervalTicks = 1e3 / $fps;
  let $onTick = void 0;
  let $lastTick = performance.now();
  let $tickCount = 0;
  let $lastFPSUpdate = performance.now();
  let $framesThisSecond = 0;
  const load = ({ fps } = {}) => {
    $fps = fps ?? $fps;
    $intervalTicks = 1e3 / $fps;
  };
  const pause = () => {
    $loopRunning = false;
    if ($loopId !== void 0) {
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
      if (now - $lastFPSUpdate >= 1e3) {
        $fps = $framesThisSecond;
        $framesThisSecond = 0;
        $lastFPSUpdate = now;
      }
      if ($onTick) $onTick({ delta, usage, tickCount: $tickCount, fps: $fps });
      $tickCount++;
    }
    $loopId = requestAnimationFrame(loop);
  };
  const onTick = (onTickCallback) => ($onTick = onTickCallback);
  const getFPS = () => $fps;
  return {
    load,
    start,
    pause,
    onTick,
    getFPS,
  };
};
export { TickerQueue, queue, ticker, windowTicker };
