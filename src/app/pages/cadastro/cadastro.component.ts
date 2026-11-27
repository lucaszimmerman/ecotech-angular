import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Registration } from '../../data/api-models';
import { AuthService } from '../../services/auth.service/auth.service';
import { FEATURES, GOOGLE_LOGIN_URL } from '../../services/api.config';
import { RequestState } from '../../shared/request-state';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CadastroComponent {
  readonly features = FEATURES;
  readonly googleUrl = GOOGLE_LOGIN_URL;
  readonly request = new RequestState();
  readonly input: Registration = {
    username: '',
    password: '',
    name: '',
    email: '',
  };
  private registrationInterrupted = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  get canResume() {
    return this.registrationInterrupted && this.auth.hasSession;
  }

  register() {
    if (this.request.busy || this.canResume) return;
    const hadSession = this.auth.hasSession;
    this.registrationInterrupted = false;
    const input = {
      ...this.input,
      name: this.input.name.trim(),
      username: this.input.username.trim(),
    };
    this.request.run(
      this.auth.register(input),
      () => {
        void this.router.navigateByUrl('/boas-vindas', { replaceUrl: true });
      },
      () => {
        this.registrationInterrupted = !hadSession && this.auth.hasSession;
        if (this.registrationInterrupted)
          this.request.error =
            'Conta criada. Continue para configurar seu perfil.';
      },
    );
  }
}
