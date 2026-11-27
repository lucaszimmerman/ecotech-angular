import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';
import { RequestState } from '../../shared/request-state';

@Component({
  template: ` <app-auth-frame>
    <header class="auth-heading">
      <h1>{{ title }}</h1>
    </header>
    @if (mode === 'forgot' && !request.success) {
      <form #forgot="ngForm" (ngSubmit)="send()">
        <label
          >E-mail
          <input
            type="email"
            name="email"
            autocomplete="email"
            required
            email
            [(ngModel)]="email"
        /></label>
        <button class="primary" [disabled]="forgot.invalid || request.busy">
          Solicitar recuperação
        </button>
      </form>
    }
    @if (mode === 'reset' && token && !request.success) {
      <form #reset="ngForm" (ngSubmit)="change()">
        <label
          >Nova senha
          <input
            type="password"
            name="password"
            autocomplete="new-password"
            required
            minlength="6"
            maxlength="72"
            [(ngModel)]="password"
        /></label>
        <label
          >Confirme a nova senha
          <input
            type="password"
            name="confirmation"
            autocomplete="new-password"
            required
            [(ngModel)]="confirmation"
        /></label>
        <button class="primary" [disabled]="reset.invalid || request.busy">
          Redefinir senha
        </button>
      </form>
    }
    <app-status
      [state]="request"
      [retry]="mode === 'verify' && !!token"
      (attempt)="verify()"
    ></app-status>
    <p class="auth-footer"><a routerLink="/login">Voltar para o login</a></p>
  </app-auth-frame>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class EmailFlowComponent implements OnInit {
  readonly request = new RequestState();
  mode = this.route.snapshot.data['mode'] as 'forgot' | 'reset' | 'verify';
  token = this.route.snapshot.queryParamMap.get('token') || '';
  email = '';
  password = '';
  confirmation = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
  ) {}

  get title() {
    return {
      forgot: 'Recuperar senha',
      reset: 'Redefinir senha',
      verify: 'Confirmar e-mail',
    }[this.mode];
  }

  ngOnInit() {
    if (this.mode !== 'forgot' && !this.token)
      this.request.error = 'O link está incompleto. Solicite um novo.';
    if (this.mode === 'verify' && this.token) this.verify();
  }

  verify() {
    this.request.run(this.auth.verifyEmail(this.token), () => {
      this.request.success = 'E-mail confirmado.';
      if (this.auth.hasSession)
        this.auth.refresh().subscribe({ error: () => {} });
      this.clearToken();
    });
  }

  send() {
    this.request.run(this.auth.forgotPassword(this.email), () => {
      this.request.success =
        'Se houver uma conta com esse e-mail, você receberá as instruções.';
    });
  }

  change() {
    if (this.password !== this.confirmation) {
      this.request.error = 'As senhas precisam ser iguais.';
      return;
    }
    this.request.run(
      this.auth.resetPassword({
        token: this.token,
        newPassword: this.password,
        confirmPassword: this.confirmation,
      }),
      () => {
        this.auth.logout();
        this.request.success = 'Senha redefinida. Entre novamente.';
        this.clearToken();
      },
    );
  }

  private clearToken() {
    this.token = '';
    history.replaceState(history.state, '', location.pathname);
  }
}
