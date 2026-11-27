import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service/auth.service';
import { RequestState } from '../../shared/request-state';

/**
 * Retorno do login/cadastro com Google. O backend redireciona para
 * /auth/google?code=... (ou ?erro=...) e o código é trocado pelo JWT.
 */
@Component({
  template: `<app-auth-frame>
    <header class="auth-heading"><h1>Entrar com Google</h1></header>
    <app-status [state]="request" label="Concluindo login com Google…"></app-status>
    @if (request.error) {
      <p class="auth-footer"><a routerLink="/login">Voltar para o login</a></p>
    }
  </app-auth-frame>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class GoogleCallbackComponent implements OnInit {
  readonly request = new RequestState();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const query = this.route.snapshot.queryParamMap;
    const code = query.get('code') || '';
    const error = query.get('erro');
    const created = query.get('novo') === '1';
    // O código é de uso único: tira da barra de endereço e do histórico.
    history.replaceState(history.state, '', location.pathname);

    if (error || !code) {
      this.request.error = error || 'O login com Google não foi concluído. Tente novamente.';
      return;
    }
    this.request.run(this.auth.loginWithGoogle(code), () => {
      void this.router.navigateByUrl(created ? '/boas-vindas' : '/home', { replaceUrl: true });
    });
  }
}
