import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';
import { UserService } from '../../services/user.service/user.service';
import { RequestState } from '../../shared/request-state';
import { FEATURES } from '../../services/api.config';

@Component({
  template: ` <app-nav-bar></app-nav-bar>
    <div class="layout">
      <app-left-bar></app-left-bar>
      @if (auth.currentUser | async; as user) {
        <main class="column">
          <section class="surface">
            <h1>Minha conta</h1>
            <p>
              {{ user.email }}
              @if (features.emailFlows) {
                ·
                {{
                  user.emailVerified
                    ? 'E-mail confirmado'
                    : 'E-mail pendente de confirmação'
                }}
              }
            </p>
            @if (features.emailFlows && !user.emailVerified) {
              <button
                type="button"
                [disabled]="verification.busy || !!verification.success"
                (click)="resend()"
              >
                Enviar confirmação
              </button>
            }
            <app-status
              [state]="verification"
              label="Enviando confirmação…"
            ></app-status>
          </section>
          <section class="surface">
            <h2>Meu perfil</h2>
            <p>Complete sua bio, cidade, site e imagens quando quiser.</p>
            <a class="secondary-link" routerLink="/boas-vindas"
              >Completar perfil</a
            >
          </section>
          <section class="surface">
            <h2>Alterar senha</h2>
            <form #form="ngForm" (ngSubmit)="change()">
              <label
                >Senha atual
                <input
                  type="password"
                  name="current"
                  autocomplete="current-password"
                  required
                  [(ngModel)]="password.currentPassword"
              /></label>
              <label
                >Nova senha
                <input
                  type="password"
                  name="next"
                  autocomplete="new-password"
                  required
                  minlength="6"
                  maxlength="72"
                  [(ngModel)]="password.newPassword"
              /></label>
              <label
                >Confirme a nova senha
                <input
                  type="password"
                  name="confirm"
                  autocomplete="new-password"
                  required
                  [(ngModel)]="password.confirmPassword"
              /></label>
              <button
                class="primary"
                [disabled]="form.invalid || changing.busy"
              >
                Alterar senha
              </button>
            </form>
            <app-status
              [state]="changing"
              label="Alterando senha…"
            ></app-status>
          </section>
          <section class="surface">
            <h2>Excluir conta</h2>
            <p>Esta ação é permanente.</p>
            <button
              type="button"
              class="danger"
              [disabled]="deleting.busy"
              (click)="remove(user.id)"
            >
              Excluir minha conta
            </button>
            <app-status
              [state]="deleting"
              label="Excluindo conta…"
            ></app-status>
          </section>
        </main>
      }
    </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AccountComponent {
  readonly features = FEATURES;
  readonly verification = new RequestState();
  readonly changing = new RequestState();
  readonly deleting = new RequestState();
  password = { currentPassword: '', newPassword: '', confirmPassword: '' };

  constructor(
    public auth: AuthService,
    private users: UserService,
    private router: Router,
  ) {}

  resend() {
    this.verification.run(this.auth.resendVerification(), () => {
      this.verification.success = 'Solicitação de confirmação processada.';
    });
  }

  change() {
    if (this.password.newPassword !== this.password.confirmPassword) {
      this.changing.error = 'As senhas precisam ser iguais.';
      return;
    }
    this.changing.run(this.users.changePassword(this.password), () => {
      this.password = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      this.changing.success = 'Senha alterada.';
    });
  }

  remove(id: string) {
    if (!window.confirm('Excluir permanentemente sua conta da EcoTech?'))
      return;
    this.deleting.run(this.users.delete(id), () => {
      this.auth.logout();
      void this.router.navigate(['/login'], { replaceUrl: true });
    });
  }
}
