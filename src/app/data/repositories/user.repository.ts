import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChangePassword, CurrentUser, Id, Page, Profile, ProfileInput, Registration, UserSummary } from '../api-models';
import { API_BASE_URL } from '../../services/api.config';
import { imageForm, pageParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class UserRepository {
  private readonly base = API_BASE_URL + '/users';
  constructor(private http: HttpClient) {}

  me() { return this.http.get<CurrentUser>(this.base + '/me'); }

  privateProfile(id: Id) { return this.http.get<CurrentUser>(this.base + '/' + id); }

  profile(id: Id) { return this.http.get<Profile>(this.base + '/' + id + '/profile'); }

  search(q: string, page = 0) {
    return this.http.get<Page<UserSummary>>(this.base + '/search', { params: pageParams(page).set('q', q) });
  }

  listForAdmin() { return this.http.get<CurrentUser[]>(this.base); }

  create(input: Registration) {
    return this.http.post<void>(this.base, input, { observe: 'response' });
  }

  update(id: Id, input: ProfileInput) { return this.http.put<void>(this.base + '/' + id, input); }

  delete(id: Id) { return this.http.delete<void>(this.base + '/' + id); }

  changePassword(input: ChangePassword) { return this.http.patch<void>(this.base + '/me/password', input); }

  upload(kind: 'profile' | 'cover', file: File) {
    return this.http.patch<void>(this.base + '/me/' + kind + '-image', imageForm(file));
  }
}
