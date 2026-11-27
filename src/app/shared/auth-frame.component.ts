import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-auth-frame',
  template: `
    <main class="auth-page">
      <div class="auth-photo" aria-hidden="true"></div>
      <div class="auth-layout">
        <div class="auth-intro">
          <a class="brand brand-on-photo" routerLink="/home">
            <span class="brand-mark" aria-hidden="true"></span>EcoTech
          </a>
          <div class="auth-message">
            <p class="auth-tagline">
              Ideias que mudam<br class="auth-break" />
              o futuro.
            </p>
            <p>
              Compartilhe iniciativas de sustentabilidade e encontre pessoas que
              querem fazer a diferença.
            </p>
          </div>
        </div>
        <section class="surface auth-card enter">
          <ng-content></ng-content>
        </section>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AuthFrameComponent {}
