import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Comment, Id, Page } from '../api-models';
import { API_BASE_URL } from '../../services/api.config';
import { pageParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class CommentRepository {
  constructor(private http: HttpClient) {}
  private url(postId: Id) { return API_BASE_URL + '/posts/' + postId + '/comments'; }

  list(postId: Id, page: number) {
    return this.http.get<Page<Comment>>(this.url(postId), { params: pageParams(page) });
  }

  count(postId: Id) { return this.http.get<number>(this.url(postId) + '/count'); }

  get(postId: Id, id: Id) { return this.http.get<Comment>(this.url(postId) + '/' + id); }

  create(postId: Id, content: string) {
    return this.http.post<void>(this.url(postId), { content }, { observe: 'response' });
  }

  update(postId: Id, id: Id, content: string) {
    return this.http.put<void>(this.url(postId) + '/' + id, { content });
  }

  delete(postId: Id, id: Id) { return this.http.delete<void>(this.url(postId) + '/' + id); }
}
