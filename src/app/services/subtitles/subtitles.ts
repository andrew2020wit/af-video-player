import { computed, Service, signal } from '@angular/core';
import { WebVTTParser } from 'webvtt-parser';
import { SubtitleItem, SubtitleItemExtended, SubtitleNumber } from './model/subtitle.type';

@Service()
export class Subtitles {
  public currentTimeMs = signal(0);

  private mainSubtitles = signal<SubtitleItem[]>([]);
  private secondSubtitles = signal<SubtitleItem[]>([]);

  public readonly allSubtitles = computed<SubtitleItemExtended[]>(() => {
    const mainSubtitles = this.mainSubtitles();
    const secondSubtitles = this.secondSubtitles();
    const secondSubtitlesReversed = [...secondSubtitles].reverse();

    if (secondSubtitles.length === 0) {
      return mainSubtitles.map<SubtitleItemExtended>((x) => ({ ...x, secondSub: '' }));
    }

    const getTooltip = (endTimeMs: number, acc: string): string => {
      const subTime = secondSubtitlesReversed.at(-1)?.startTimeMs;

      if (!subTime || subTime > endTimeMs) {
        return acc;
      }

      const sub = secondSubtitlesReversed.pop();

      const newAcc = acc + (sub?.text ?? '');

      return getTooltip(endTimeMs, newAcc);
    };

    return mainSubtitles.map<SubtitleItemExtended>((sub) => ({
      ...sub,
      secondSub: getTooltip(sub.endTimeMs, ''),
    }));
  });

  public set(text: string, subNumber: SubtitleNumber) {
    this.setVttSubtitles(text, subNumber);
  }

  private setVttSubtitles(text: string, subNumber: SubtitleNumber) {
    const parser = new WebVTTParser();
    const tree = parser.parse(text, 'subtitles');

    const subs = tree.cues.map<SubtitleItem>((cue) => ({
      startTimeMs: cue.startTime * 1000,
      endTimeMs: cue.endTime * 1000,
      text: this.clearText(cue.text),
    }));

    if (subNumber === 'first') {
      this.mainSubtitles.set(subs);
    } else {
      this.secondSubtitles.set(subs);
    }
  }

  private clearText(text: string): string {
    return text
      .replaceAll('<i>', '')
      .replaceAll('</i>', '')
      .replaceAll('<b>', '')
      .replaceAll('</b>', '');
  }
}
