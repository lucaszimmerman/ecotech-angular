import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginInput, LoginResponse, Registration, ResetPassword } from '../api-models';
import { PUBLIC_REQUEST } from '../session';
import { API_BASE_URL } from '../../services/api.config';

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly base = API_BASE_URL + '/auth';
  constructor(private http: HttpClient) {}

  private get publicOptions() {
    return { context: new HttpContext().set(PUBLIC_REQUEST, true) };
  }

  login(input: LoginInput) {
    return this.http.post<LoginResponse>(this.base + '/login', input, this.publicOptions);
  }

  register(input: Registration) {
    return this.http.post<LoginResponse>(this.base + '/register', input, this.publicOptions);
  }

  /** Troca o código de uso único devolvido pelo login Google pelo JWT. */
  exchangeGoogleCode(code: string) {
    return this.http.post<LoginResponse>(this.base + '/google/exchange', { code }, this.publicOptions);
  }

  verifyEmail(token: string) {
    return this.http.get(this.base + '/verify-email', {
      ...this.publicOptions, params: { token }, responseType: 'text'
    });
  }

  resendVerification() {
    return this.http.post<void>(this.base + '/resend-verification', null);
  }

  forgotPassword(email: string) {
    return this.http.post<void>(this.base + '/forgot-password', { email }, this.publicOptions);
  }

  resetPassword(input: ResetPassword) {
    return this.http.post<void>(this.base + '/reset-password', input, this.publicOptions);
  }
}
