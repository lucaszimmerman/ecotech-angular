import { Component, NgModule, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { FEATURES } from './services/api.config';
import { GoogleCallbackComponent } from './pages/login/google-callback.component';
import { AuthGuard } from './auth.guard';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { EmailFlowComponent } from './pages/login/email-flow.component';
import { LoginComponent } from './pages/login/login.component';
import { AccountComponent } from './pages/perfil/account.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { PostPageComponent } from './pages/post-page/post-page.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

@Component({
  template:
    '<app-auth-frame><h1>Página não encontrada</h1><p class="muted">O endereço pode ter mudado ou a publicação foi removida.</p><a class="secondary-link" routerLink="/home"><app-icon name="arrow-left"></app-icon>Voltar ao início</a></app-auth-frame>',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class NotFoundComponent {}

/** Fluxos de e-mail ficam fora do ar até o SES ser validado (FEATURES.emailFlows). */
const emailFlowsEnabled = () =>
  FEATURES.emailFlows || inject(Router).createUrlTree(['/login']);

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'auth/google', component: GoogleCallbackComponent },
  {
    path: 'auth/forgot-password',
    component: EmailFlowComponent,
    data: { mode: 'forgot' },
    canActivate: [emailFlowsEnabled],
  },
  {
    path: 'auth/reset-password',
    component: EmailFlowComponent,
    data: { mode: 'reset' },
    canActivate: [emailFlowsEnabled],
  },
  {
    path: 'auth/verify-email',
    component: EmailFlowComponent,
    data: { mode: 'verify' },
    canActivate: [emailFlowsEnabled],
  },
  {
    path: 'boas-vindas',
    component: WelcomeComponent,
    canActivate: [AuthGuard],
  },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'perfil/:id', component: PerfilComponent, canActivate: [AuthGuard] },
  { path: 'post/:id', component: PostPageComponent, canActivate: [AuthGuard] },
  { path: 'conta', component: AccountComponent, canActivate: [AuthGuard] },
  { path: '**', component: NotFoundComponent },
];

@NgModule({ imports: [RouterModule.forRoot(routes)], exports: [RouterModule] })
export class AppRoutingModule {}
