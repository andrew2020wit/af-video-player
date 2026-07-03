import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { Subtitles } from './services/subtitles/subtitles';
import { SubtitleNumber } from './services/subtitles/model/subtitle.type';
import { FormatDurationPipe } from './pipes/format-duration-pipe';
import { MatProgressBar } from '@angular/material/progress-bar';
import { takeSelectedWord } from './utils/take-selected-word';
import { MatFormField, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { CommandService } from './services/command/command.service';
import { CommandEnum } from './services/command/enums/command.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HistoryService } from './services/history/history-service';
import { LocalStorage } from './services/local-storage/local-storage';
import { LocalStorageKeys } from './services/local-storage/model/local-storage-keys.enum';

@Component({
  selector: 'app-root',
  imports: [
    MatIcon,
    MatButton,
    FormatDurationPipe,
    MatProgressBar,
    MatMiniFabButton,
    MatFormField,
    MatInput,
    FormsModule,
    MatTooltip,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(document:mousemove)': 'onMouseMove()',
    '[class.subs-visible]': 'subtitlesVisible()',
    '[class.hide-mouse]': '!panelVisible()',
    '[class.mix-subs-mode]': 'mixSubsMode()',
  },
})
export class App implements OnInit, AfterViewInit {
  private readonly localStorage = inject(LocalStorage);

  public readonly subtitlesVisible = signal(!!this.localStorage.get(LocalStorageKeys.subsIsOn));

  public readonly panelVisible = signal(true);

  public readonly mixSubsMode = signal(!!this.localStorage.get(LocalStorageKeys.subsMixIsOn));

  protected readonly showSubsPopup = signal(false);

  protected readonly isPlaying = signal(false);
  protected readonly videoFileIsSelected = signal(false);
  protected readonly showOpenFilesPopup = signal(true);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly currentSubStartTime = signal(0);
  protected readonly userSelectSubStartTime = signal(0);

  protected readonly defaultDictionaryUrl = 'https://www.ldoceonline.com/dictionary/{{term}}';
  protected readonly progressBarId = 'video-player-progress-bar';

  protected readonly subtitles = inject(Subtitles);

  protected dictionaryUrl = signal(
    this.localStorage.get(LocalStorageKeys.dictionaryUrl) || this.defaultDictionaryUrl,
  );

  private hideTimeout?: number;
  private videoElement: HTMLVideoElement | undefined;

  private readonly videoPlayerElementRef = viewChild<ElementRef<HTMLVideoElement>>('videoPlayer');

  private readonly historyService = inject(HistoryService);
  protected readonly history = signal(this.historyService.getHistory());

  private readonly title = inject(Title);
  private readonly commandService = inject(CommandService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly hideDelayMs = 2000;

  constructor() {
    effect(() => {
      if (this.showSubsPopup()) {
        const subtitlesVisible = untracked(() => this.subtitlesVisible());

        if (subtitlesVisible) {
          return;
        }

        setTimeout(() => {
          this.scrollToCurrentSub(true);
        }, 100);
      }
    });
  }

  public ngOnInit(): void {
    this.commandServiceSubscribe();
  }

  public ngAfterViewInit(): void {
    this.videoElement = this.videoPlayerElementRef()?.nativeElement;
  }

  public onMouseMove(): void {
    this.panelVisible.set(true);

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      this.panelVisible.set(false);
    }, this.hideDelayMs);
  }

  protected switchMixSubsMode(): void {
    this.mixSubsMode.update((x) => !x);

    this.localStorage.set(LocalStorageKeys.subsMixIsOn, this.mixSubsMode() ? 'true' : '');
  }

  protected go(): void {
    this.showOpenFilesPopup.set(false);
    this.play();
  }

  protected goTo(timeMs: number): void {
    const videoElement = this.videoElement;

    if (!videoElement) return;

    videoElement.currentTime = timeMs / 1000;
    this.play();
    this.scrollToCurrentSub();
  }

  protected scrollToCurrentSub(popupMode = false): void {
    const currentTime = this.videoElement?.currentTime;

    if (!currentTime) return;

    const allSubtitles = this.subtitles.allSubtitles();

    let subIndex = allSubtitles.findIndex((sub) => sub.startTimeMs > currentTime * 1000);

    if (subIndex === -1) {
      return;
    }

    subIndex -= 1;

    if (subIndex < 0) {
      subIndex = 0;
    }

    const sub = allSubtitles[subIndex];

    if (!sub) return;

    const currentSubStartTime = sub.startTimeMs;

    if (currentSubStartTime === this.currentSubStartTime() && !popupMode) {
      return;
    }

    this.currentSubStartTime.set(currentSubStartTime);

    const selectorKey = popupMode ? 'data-popup-sub-item-start-time' : 'data-sub-item-start-time';

    const el = document.querySelector(`[${selectorKey}="${currentSubStartTime.toString()}"]`);

    if (!el) return;

    el.scrollIntoView({ behavior: 'instant', block: 'center' });
  }

  protected takeSelectedWord(): void {
    const word = takeSelectedWord();

    const term = '{{term}}';

    let url = this.dictionaryUrl();

    url = url.replace(term, word);

    window.open(url, '_blank');
  }

  protected setDictionaryUrl(): void {
    this.localStorage.set(LocalStorageKeys.dictionaryUrl, this.dictionaryUrl());
  }

  protected seekTo(ev: MouseEvent): void {
    if (!this.duration()) return;

    const xPos = ev.clientX;

    const progressBar = document.getElementById(this.progressBarId);

    if (!progressBar) return;

    const progressRect = progressBar.getBoundingClientRect();

    if (xPos < progressRect.left || xPos > progressRect.right) return;

    const currentTime = ((xPos - progressRect.left) / progressRect.width) * this.duration() || 0;

    if (!this.videoElement) return;

    this.videoElement.currentTime = currentTime;
  }

  protected onLoadedMetadata(): void {
    this.duration.set(this.videoElement?.duration || 0);
  }

  protected onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.videoElement) return;

    this.videoFileIsSelected.set(true);

    this.videoElement.src = URL.createObjectURL(file);
    this.setTitle(file.name);
    this.isPlaying.set(false);

    const currentTimeMs = this.historyService.setCurrentFileAndReturnCurrentPositionSec(file.name);

    this.videoElement.currentTime = currentTimeMs;
  }

  protected async onSrtSelected(event: Event, subNumber: SubtitleNumber): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const text = await file.text();

    this.subtitles.set(text, subNumber);
  }

  protected onTimeUpdate(): void {
    this.currentTime.set(this.videoElement?.currentTime || 0);

    const currentTimeMs = (this.videoElement?.currentTime || 0) * 1000;
    this.subtitles.currentTimeMs.set(currentTimeMs);

    const currentTime = this.videoElement?.currentTime;

    if (currentTime) {
      this.historyService.setCurrentVideoFilePositionSec(currentTime);
    }

    this.scrollToCurrentSub();
  }

  protected onVideoEnded(): void {
    this.isPlaying.set(false);
  }

  protected play(): void {
    this.videoElement?.play();
    this.isPlaying.set(true);
    this.showSubsPopup.set(false);
  }

  protected pause(): void {
    this.videoElement?.pause();
    this.isPlaying.set(false);
    this.showSubsPopup.set(true);
  }

  protected switchPlayPause(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  protected toggleSubtitles(): void {
    this.subtitlesVisible.update((x) => !x);
    this.localStorage.set(LocalStorageKeys.subsIsOn, this.subtitlesVisible() ? 'true' : '');
  }

  protected reload(): void {
    window.location.reload();
  }

  private setTitle(title: string): void {
    this.title.setTitle(title);
  }

  private goBack(): void {
    const videoElement = this.videoElement;

    if (!videoElement) {
      return;
    }

    let currentTime = videoElement.currentTime || 0;

    currentTime -= 5; // 5 seconds back

    if (currentTime < 0) {
      currentTime = 0;
    }

    videoElement.currentTime = currentTime;
  }

  private goForward(): void {
    const videoElement = this.videoElement;

    if (!videoElement) {
      return;
    }

    let currentTime = videoElement.currentTime || 0;

    currentTime += 5; // 5 seconds forward

    const duration = videoElement.duration;

    if (currentTime > duration) {
      currentTime = duration;
    }

    videoElement.currentTime = currentTime;
  }

  private commandServiceSubscribe(): void {
    this.commandService.commands$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((command) => {
      switch (command) {
        case CommandEnum.switchPlayPause:
          this.switchPlayPause();
          break;
        case CommandEnum.switchSubs:
          this.toggleSubtitles();
          break;
        case CommandEnum.switchMixSubsMode:
          this.switchMixSubsMode();
          break;
        case CommandEnum.goBack:
          this.goBack();
          break;
        case CommandEnum.goForward:
          this.goForward();
          break;
      }
    });
  }
}
