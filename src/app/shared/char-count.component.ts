import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Contador de caracteres para campos de texto com limites. Mostra quantos
 * faltam para o mínimo e o total usado, para o usuário entender por que o
 * botão de envio está desabilitado.
 */
@Component({
  selector: 'app-char-count',
  template: `
    @if (length > 0 && length < min) {
      <span>Mínimo de {{ min }} caracteres ({{ min - length }} restantes)</span>
    } @else {
      <span [class.char-count-limit]="length > max * 0.9">{{ length }}/{{ max }}</span>
    }
  `,
  host: { class: 'char-count', 'aria-live': 'polite' },
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CharCountComponent {
  @Input() value: string | null | undefined = '';
  @Input() min = 0;
  @Input({ required: true }) max!: number;

  get length() {
    return (this.value || '').trim().length;
  }
}
