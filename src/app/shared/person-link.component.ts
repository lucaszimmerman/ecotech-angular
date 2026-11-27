import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UserSummary } from '../data/api-models';

/** Linha com foto, nome e @usuário que leva ao perfil. Usada em buscas e listas de pessoas. */
@Component({
  selector: 'app-person-link',
  template: `
    <a class="person person-link" [routerLink]="['/perfil', person.id]">
      <img class="avatar" [src]="person.profileImageUrl | mediaUrl" [width]="size" [height]="size" alt="" loading="lazy" />
      <span class="person-name">
        <strong>{{ person.name }}</strong>
        <small>&#64;{{ person.username }}</small>
      </span>
      @if (arrow) {
        <app-icon class="row-arrow" name="chevron-right"></app-icon>
      }
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PersonLinkComponent {
  @Input({ required: true }) person!: UserSummary;
  @Input() size = 36;
  @Input() arrow = false;
}
