import { Injectable } from '@angular/core';

import { fromEvent, Subject } from 'rxjs';
import { CommandEnum } from './enums/command.enum';

@Injectable({
  providedIn: 'root',
})
export class CommandService {
  private readonly commandsInner$ = new Subject<CommandEnum>();

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly commands$ = this.commandsInner$.asObservable();

  constructor() {
    fromEvent<KeyboardEvent>(window, 'keyup').subscribe((event) => {
      this.emmitCommand(event);
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
      }
    });
  }

  private emmitCommand(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.commandsInner$.next(CommandEnum.switchPlayPause);
      return;
    }

    if (event.code === 'KeyS') {
      this.commandsInner$.next(CommandEnum.switchSubs);
      return;
    }

    if (event.code === 'ArrowLeft') {
      this.commandsInner$.next(CommandEnum.goBack);
      return;
    }

    if (event.code === 'ArrowRight') {
      this.commandsInner$.next(CommandEnum.goForward);
      return;
    }
  }
}
