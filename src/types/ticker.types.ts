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
