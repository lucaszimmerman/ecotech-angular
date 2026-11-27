import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ICONS, IconName } from './icons';

/**
 * Ícone SVG decorativo. Use junto de um texto visível ou de `aria-label` no
 * elemento clicável: o ícone em si fica oculto para leitores de tela.
 *
 *   <app-icon name="heart" [filled]="liked"></app-icon>
 */
@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      [attr.fill]="filled ? 'currentColor' : 'none'">
      @for (path of paths; track $index) {
        <path [attr.d]="path"></path>
      }
    </svg>`,
  host: { class: 'icon' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() filled = false;

  get paths(): readonly string[] {
    return ICONS[this.name];
  }
}
