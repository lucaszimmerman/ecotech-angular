import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Id, LikeStatus, Page, UserSummary } from '../api-models';
import { API_BASE_URL } from '../../services/api.config';
import { pageParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class LikeRepository {
  constructor(private http: HttpClient) {}
  private url(postId: Id) { return API_BASE_URL + '/posts/' + postId + '/likes'; }

  list(postId: Id, page: number) {
    return this.http.get<Page<UserSummary>>(this.url(postId), { params: pageParams(page) });
  }

  status(postId: Id) { return this.http.get<LikeStatus>(this.url(postId) + '/status'); }

  set(postId: Id, liked: boolean) {
    return liked ? this.http.post<void>(this.url(postId), null) : this.http.delete<void>(this.url(postId));
  }
}
