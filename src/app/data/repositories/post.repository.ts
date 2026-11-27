import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Id, Page, Post } from '../api-models';
import { API_BASE_URL } from '../../services/api.config';
import { pageParams, postForm } from './api-params';

@Injectable({ providedIn: 'root' })
export class PostRepository {
  private readonly base = API_BASE_URL + '/posts';
  constructor(private http: HttpClient) {}

  list(page: number, scope: 'feed' | 'all' | { userId: Id }) {
    const suffix = typeof scope === 'object' ? '/user/' + scope.userId : scope === 'feed' ? '/feed' : '';
    return this.http.get<Page<Post>>(this.base + suffix, { params: pageParams(page) });
  }

  get(id: Id) { return this.http.get<Post>(this.base + '/' + id); }

  create(content: string, file: File | null) {
    return this.http.post<void>(this.base, postForm(content, file), { observe: 'response' });
  }

  update(id: Id, content: string, file: File | null, removeImage: boolean) {
    return this.http.put<void>(this.base + '/' + id, postForm(content, file, removeImage));
  }

  delete(id: Id) { return this.http.delete<void>(this.base + '/' + id); }
}
