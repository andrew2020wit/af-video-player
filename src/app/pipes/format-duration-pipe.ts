import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration',
})
export class FormatDurationPipe implements PipeTransform {
  transform(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const secondsStr = (seconds % 60).toString().padStart(2, '0');
    const minutesStr = (minutes % 60).toString().padStart(2, '0');

    return `${hours > 0 ? hours + ':' : ''}${minutesStr}:${secondsStr}`;
  }
}
