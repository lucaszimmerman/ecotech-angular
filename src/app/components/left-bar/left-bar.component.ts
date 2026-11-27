import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../services/auth.service/auth.service';
import { navLinks } from '../../shared/nav-links';

@Component({
  selector: 'app-left-bar',
  templateUrl: './left-bar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LeftBarComponent {
  readonly links = navLinks;

  constructor(public auth: AuthService) {}
}
