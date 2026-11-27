import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpContext } from '@angular/common/http';
import { ApiActivity } from './data/api-activity';
import { PUBLIC_REQUEST, Session } from './data/session';
import { API_BASE_URL } from './services/api.config';
import { DarkModeService } from './services/dark-mode/dark-mode.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AppComponent {
  constructor(
    session: Session,
    router: Router,
    public theme: DarkModeService,
    public activity: ApiActivity,
    http: HttpClient,
  ) {
    // Acorda a API assim que o site abre, para o login não esperar o Render iniciar.
    http
      .get(API_BASE_URL + '/actuator/health', {
        context: new HttpContext().set(PUBLIC_REQUEST, true),
      })
      .subscribe({ error: () => {} });
    session.changes
      .pipe(
        skip(1),
        filter((value) => !value),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const current = router.url;
        if (
          /^\/(home|perfil|post|conta|boas-vindas)(?:[/?#]|$)/.test(current)
        ) {
          void router.navigate(['/login'], {
            queryParams: { returnUrl: current },
            replaceUrl: true,
          });
        }
      });
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        window.scrollTo(0, 0);
      });
  }
}
