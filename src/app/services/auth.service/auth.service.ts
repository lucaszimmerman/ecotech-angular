import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { CurrentUser, LoginInput, LoginResponse, Registration, ResetPassword } from '../../data/api-models';
import { AuthRepository } from '../../data/repositories/auth.repository';
import { UserRepository } from '../../data/repositories/user.repository';
import { Session } from '../../data/session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = new BehaviorSubject<CurrentUser | null>(null);
  readonly currentUser = this.user.asObservable();
  private restoring?: { token: string | null; request: Observable<CurrentUser> };

  constructor(private auth: AuthRepository, private users: UserRepository, private session: Session) {
    this.session.changes.subscribe(token => { if (!token) this.user.next(null); });
  }

  get currentUserValue() { return this.user.value; }
  get hasSession() { return !!this.session.token; }

  login(input: LoginInput) { return this.auth.login(input).pipe(switchMap(response => this.start(response))); }
  register(input: Registration) { return this.auth.register(input).pipe(switchMap(response => this.start(response))); }
  loginWithGoogle(code: string) { return this.auth.exchangeGoogleCode(code).pipe(switchMap(response => this.start(response))); }

  private start(response: LoginResponse) {
    this.user.next(null);
    this.session.start(response);
    return this.refresh();
  }

  refresh(): Observable<CurrentUser> {
    const token = this.session.token;
    if (this.restoring?.token === token) return this.restoring.request;
    const request = this.users.me().pipe(
      tap(user => {
        if (this.session.token !== token) throw new Error('A sessão mudou durante a consulta.');
        this.user.next(user);
      }),
      finalize(() => { if (this.restoring?.request === request) this.restoring = undefined; }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.restoring = { token, request };
    return request;
  }

  restore() {
    if (!this.hasSession) return of(false);
    if (this.currentUserValue) return of(true);
    return this.refresh().pipe(map(() => true), catchError(() => of(false)));
  }

  logout() { this.session.clear(); }
  verifyEmail(token: string) { return this.auth.verifyEmail(token); }
  resendVerification() { return this.auth.resendVerification(); }
  forgotPassword(email: string) { return this.auth.forgotPassword(email); }
  resetPassword(input: ResetPassword) { return this.auth.resetPassword(input); }
}
