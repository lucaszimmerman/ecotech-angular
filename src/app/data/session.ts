import { HttpContextToken, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, throwError, timeout } from 'rxjs';
import { ApiActivity } from './api-activity';
import { API_BASE_URL, API_TIMEOUT_MS } from '../services/api.config';
import { LoginResponse } from './api-models';

export const PUBLIC_REQUEST = new HttpContextToken(() => false);

interface SessionToken { accessToken: string; expiresAt: number; }

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly key = 'ecotech.session';
  private readonly state = new BehaviorSubject<SessionToken | null>(null);
  private expiry?: ReturnType<typeof setTimeout>;
  readonly changes = this.state.asObservable();

  constructor() {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('ecotech.local.database.v1');
      const stored = JSON.parse(sessionStorage.getItem(this.key) || 'null') as SessionToken | null;
      if (stored && typeof stored.accessToken === 'string' && Number.isFinite(stored.expiresAt) && stored.expiresAt > Date.now()) {
        this.activate(stored);
      } else {
        sessionStorage.removeItem(this.key);
      }
    } catch {
      this.clear();
    }
  }

  get token() {
    const current = this.state.value;
    return current && current.expiresAt > Date.now() ? current.accessToken : null;
  }

  start(response: LoginResponse) {
    this.activate({ accessToken: response.accessToken, expiresAt: Date.now() + response.expiresIn * 1000 });
  }

  clear() {
    clearTimeout(this.expiry);
    try { sessionStorage.removeItem(this.key); } catch { /* Storage may be unavailable. */ }
    this.state.next(null);
  }

  private activate(token: SessionToken) {
    clearTimeout(this.expiry);
    try { sessionStorage.setItem(this.key, JSON.stringify(token)); } catch { /* In-memory session still works. */ }
    this.state.next(token);
    this.expiry = setTimeout(() => this.clear(), Math.max(0, token.expiresAt - Date.now()));
  }
}

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private session: Session, private activity: ApiActivity) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const base = new URL(API_BASE_URL, document.baseURI);
    const url = new URL(request.url, document.baseURI);
    const path = base.pathname.replace(/\/$/, '');
    if (url.origin !== base.origin || !url.pathname.startsWith(path + '/')) return next.handle(request);

    const token = request.context.get(PUBLIC_REQUEST) ? null : this.session.token;
    const outgoing = token ? request.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : request;
    const done = this.activity.start();
    return next.handle(outgoing).pipe(
      timeout(API_TIMEOUT_MS),
      finalize(done),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && token && this.session.token === token) {
          this.session.clear();
        }
        return throwError(() => error);
      })
    );
  }
}

