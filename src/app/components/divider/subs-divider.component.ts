import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-subs-divider',
  imports: [],
  templateUrl: './subs-divider.component.html',
  styleUrl: './subs-divider.component.scss',
})
export class SubsDivider {
  public readonly currentEndTimeMs = input.required<number>();
  public readonly nextStartTimeMs = input.required<number>();

  public readonly widthS = computed<number>(() => {
    const currentEndTimeMs = this.currentEndTimeMs();
    const nextStartTimeMs = this.nextStartTimeMs();

    if (!nextStartTimeMs) {
      return 0;
    }

    const dif = nextStartTimeMs - currentEndTimeMs;

    const minDifMs = 5 * 1000;
    const maxDifMs = 60 * 1000;

    if (dif < minDifMs) {
      return 0;
    }

    return (Math.min(maxDifMs, dif) / maxDifMs) * 100;
  });
}
