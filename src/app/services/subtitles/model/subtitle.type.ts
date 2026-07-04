export type SubtitleItem = {
  startTimeMs: number;
  endTimeMs: number;
  text: string;
};

export type SubtitleItemExtended = SubtitleItem & {
  secondSub: string;
};

export type SubtitleNumber = 'first' | 'second';
