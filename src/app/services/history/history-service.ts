import { inject, Service } from '@angular/core';
import { LocalStorage } from '../local-storage/local-storage';
import { HistoryItem } from '../local-storage/model/history.type';
import { LocalStorageKeys } from '../local-storage/model/local-storage-keys.enum';

@Service()
export class HistoryService {
  private readonly historyLength = 20;

  private readonly localStorage = inject(LocalStorage);

  public setCurrentFileAndReturnCurrentPositionSec(fileName: string): number {
    const history = this.getHistory();

    // current file
    if (history[0]?.fileName === fileName) {
      return this.getCurrentVideoFilePositionSec();
    }

    const fileHistoryItemIndex = history.findIndex((x) => x.fileName === fileName);

    // previous file
    if (fileHistoryItemIndex > -1) {
      // save previous position
      if (history[0]) {
        history[0].positionSec = this.getCurrentVideoFilePositionSec();
      }

      // set current file
      const ItemPositionSec = history[fileHistoryItemIndex].positionSec;
      this.setCurrentVideoFilePositionSec(ItemPositionSec);

      history.splice(fileHistoryItemIndex, 1);
      history.unshift({ fileName, positionSec: ItemPositionSec });

      this.localStorage.set(LocalStorageKeys.history, JSON.stringify(history));

      return ItemPositionSec;
    }

    // new file

    // save previous position
    if (history[0]) {
      history[0].positionSec = this.getCurrentVideoFilePositionSec();
    }

    history.unshift({ fileName, positionSec: 0 });
    this.setCurrentVideoFilePositionSec(0);
    this.localStorage.set(LocalStorageKeys.history, JSON.stringify(history));

    if (history.length > this.historyLength) {
      history.pop();
    }

    return 0;
  }

  public getCurrentVideoFilePositionSec(): number {
    const secString = this.localStorage.get(LocalStorageKeys.currentVideoPositionSec);

    if (!secString || !Number.isFinite(+secString)) {
      return 0;
    }

    return +secString;
  }

  public setCurrentVideoFilePositionSec(sec: number): void {
    this.localStorage.set(LocalStorageKeys.currentVideoPositionSec, sec.toString());
  }

  public getHistory(): HistoryItem[] {
    const historyJson = this.localStorage.get(LocalStorageKeys.history);

    if (!historyJson) {
      return [];
    }

    const history = JSON.parse(historyJson) as HistoryItem[];

    if (!history || !Array.isArray(history)) {
      return [];
    }

    return history;
  }
}
