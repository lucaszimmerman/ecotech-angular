import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Id, Page, UserSummary } from '../api-models';
import { API_BASE_URL } from '../../services/api.config';
import { pageParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class RelationshipRepository {
  private readonly base = API_BASE_URL + '/users/';
  constructor(private http: HttpClient) {}

  list(id: Id, kind: 'followers' | 'following', page: number, size = 20) {
    return this.http.get<Page<UserSummary>>(this.base + id + '/' + kind, { params: pageParams(page, size) });
  }

  set(id: Id, following: boolean) {
    const url = this.base + id + '/follow';
    return following ? this.http.post<void>(url, null) : this.http.delete<void>(url);
  }
}
