export type TickerConfig = {
  ticks?: number;
};
export type WindowTickerConfig = {
  fps?: number;
};

export type TickData = {
  delta: number;
  ms: number;
  usage: number;
  tickCount: number;
};
export type WindowTickData = {
  fps: number;
} & TickData;

export type OnTickFunction = (data: TickData) => void;
export type OnWindowTickFunction = (data: WindowTickData) => void;

export type TickerMutable = {
  load: (config?: TickerConfig) => void;
  start: () => void;
  pause: () => void;
  onTick: (onTickCallback: OnTickFunction) => void;
  getTicks: () => number;
};
export type WindowTickerMutable = {
  load: (config?: WindowTickerConfig) => void;
  start: () => void;
  pause: () => void;
  onTick: (onTickCallback: OnWindowTickFunction) => void;
  getFPS: () => number;
};
