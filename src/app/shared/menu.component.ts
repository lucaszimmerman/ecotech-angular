import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input } from '@angular/core';

let nextId = 0;

/**
 * Menu de opções (⋯) reutilizável. Os itens são botões projetados com a
 * classe `menu-item`; o menu fecha ao escolher um item, ao clicar fora ou
 * com Esc.
 *
 *   <app-menu label="Opções da publicação">
 *     <button type="button" class="menu-item" (click)="editar()">Editar</button>
 *   </app-menu>
 */
@Component({
  selector: 'app-menu',
  template: `
    <button type="button" class="icon-button" [attr.aria-label]="label" [title]="label"
      aria-haspopup="true" [attr.aria-expanded]="open" [attr.aria-controls]="id" (click)="toggle()">
      <app-icon name="more"></app-icon>
    </button>
    @if (open) {
      <div class="menu-panel surface enter" [id]="id" (click)="close()">
        <ng-content></ng-content>
      </div>
    }
  `,
  host: { class: 'menu' },
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class MenuComponent {
  @Input({ required: true }) label!: string;
  readonly id = 'menu-' + nextId++;
  open = false;

  constructor(private host: ElementRef<HTMLElement>) {}

  toggle() {
    this.open = !this.open;
    if (this.open) {
      requestAnimationFrame(() => this.host.nativeElement.querySelector<HTMLElement>('.menu-item')?.focus());
    }
  }

  close() {
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  outside(event: MouseEvent) {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('keydown.escape')
  escape() {
    if (!this.open) return;
    this.close();
    this.host.nativeElement.querySelector<HTMLElement>('.icon-button')?.focus();
  }
}
