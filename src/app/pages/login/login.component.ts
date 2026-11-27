import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';
import { FEATURES, GOOGLE_LOGIN_URL } from '../../services/api.config';
import { RequestState } from '../../shared/request-state';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LoginComponent implements OnInit {
  readonly features = FEATURES;
  readonly googleUrl = GOOGLE_LOGIN_URL;
  readonly request = new RequestState();
  readonly input = { username: '', password: '' };

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.auth.hasSession) this.restore();
  }

  login() {
    this.request.run(this.auth.login(this.input), () => this.enter());
  }

  restore() {
    this.request.run(this.auth.refresh(), () => this.enter());
  }

  private enter() {
    const path = this.route.snapshot.queryParamMap.get('returnUrl') || '';
    const safe =
      /^\/(home|perfil|post|conta|boas-vindas)(?:[/?#]|$)/.test(path) &&
      !path.includes('\\');
    void this.router.navigateByUrl(safe ? path : '/home', { replaceUrl: true });
  }
}
