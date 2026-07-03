import { Service } from '@angular/core';
import { LocalStorageKeys } from './model/local-storage-keys.enum';

@Service()
export class LocalStorage {
  private readonly suffix = '-af-video-player';

  public get(key: LocalStorageKeys): string {
    return localStorage.getItem(key + this.suffix) || '';
  }

  public set(key: LocalStorageKeys, value: string): void {
    localStorage.setItem(key + this.suffix, value);
  }
}
