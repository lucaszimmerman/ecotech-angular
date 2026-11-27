import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RequestState } from './request-state';

@Component({
  selector: 'app-status',
  template: `
    @if (state.busy && skeleton) {
      <div class="skeleton" aria-hidden="true"></div>
    }
    @if (state.busy) {
      <p [class.visually-hidden]="skeleton" role="status">
        <span class="spinner" aria-hidden="true"></span> {{ label }}
      </p>
    }
    @if (state.error) {
      <p role="alert" class="error">{{ state.error }}</p>
    }
    @if (state.success) {
      <p role="status" class="success enter">{{ state.success }}</p>
    }
    @if (state.error && retry) {
      <button type="button" (click)="attempt.emit()">Tentar novamente</button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class StatusComponent {
  @Input({ required: true }) state!: RequestState;
  @Input() label = 'Carregando…';
  @Input() retry = false;
  @Input() skeleton = false;
  @Output() attempt = new EventEmitter<void>();
}
