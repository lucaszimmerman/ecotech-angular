import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './services/auth.service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.auth.restore().pipe(map(ok => ok || this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    })));
  }
}
