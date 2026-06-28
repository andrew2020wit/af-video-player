export type SubtitleItem = {
  startTimeMs: number;
  endTimeMs: number;
  text: string;
};

export type SubtitleItemExtended = SubtitleItem & {
  tooltip: string;
};

export type SubtitleNumber = 'first' | 'second';
