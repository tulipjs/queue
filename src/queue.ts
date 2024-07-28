import type {
  DelayItemQueue,
  DurationItemQueue,
  QueueItemProps,
  QueueMutable,
  RepeatItemQueue,
} from "./types/main.ts";
import { TickerQueue } from "./enums/main.ts";

export const queue = (): QueueMutable => {
  let $lastId = 0;
  let $queueList: QueueItemProps[] = [];
  let $queueIdToDelete: number[] = [];

  const $queueMap: Record<
    TickerQueue,
    (props: QueueItemProps, delta: number, index: number) => boolean
  > = {
    //@ts-ignore
    [TickerQueue.DELAY]: (
      { startTime, delay, onFunc, onDone }: DelayItemQueue,
      delta: number,
    ) => {
      const isDone = performance.now() > startTime! + delay;
      if (isDone && onFunc) onFunc(delta);
      if (isDone && onDone) onDone();
      return isDone;
    },
    //@ts-ignore
    [TickerQueue.DURATION]: (
      { startTime, duration, onFunc, onDone }: DurationItemQueue,
      delta: number,
    ) => {
      const isDone = performance.now() > startTime! + duration;
      if (!isDone && onFunc) onFunc(delta);
      if (isDone && onDone) onDone();
      return isDone;
    },
    //@ts-ignore
    [TickerQueue.REPEAT]: (
      { startTime, repeatEvery, onFunc, repeats, onDone }: RepeatItemQueue,
      delta: number,
      index,
    ) => {
      // Repeats are 0 or below
      if (0 >= repeats && repeats !== undefined) {
        onDone && onDone();
        return true;
      }
      // It's not yet time to call the func
      if (!(performance.now() > startTime! + repeatEvery)) return false;

      onFunc && onFunc(delta);
      $queueList[index].startTime = performance.now();
      //@ts-ignore
      if (repeats !== undefined) $queueList[index]["repeats"] = repeats - 1;

      return false;
    },
    //@ts-ignore
    [TickerQueue.CUSTOM]: ({ onFunc }, delta) =>
      //@ts-ignore
      onFunc && Boolean(onFunc(delta!)),
  };

  const tick = (delta: number) => {
    removeQueueList();

    let index = 0;
    for (const queueItem of $queueList) {
      if (!queueItem) return;

      const isReadyToBeDeleted = $queueMap[queueItem.type](
        queueItem,
        delta,
        index,
      );
      if (isReadyToBeDeleted) $queueIdToDelete.push(queueItem.id!);

      index++;
    }
  };

  const removeQueueList = () => {
    if (!$queueIdToDelete.length) return;
    $queueList = $queueList.filter(
      (queue) => queue && !$queueIdToDelete.includes(queue.id!),
    );
    $queueIdToDelete = [];
  };

  const getQueueId = (): number => $lastId++;

  const add = (props: QueueItemProps) => {
    const id = getQueueId();
    $queueList.push({
      ...props,
      id,
      startTime: props.startTime ?? performance.now(),
    });
    return id;
  };

  const addAsync = (queueItem: QueueItemProps): Promise<number> =>
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
  const remove = (id: number) => $queueIdToDelete.push(id);

  const addList = (list: QueueItemProps[], onDone?: () => any) => {
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
