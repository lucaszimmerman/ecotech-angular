import { Injectable } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { Id, Post } from '../../data/api-models';
import { PostRepository } from '../../data/repositories/post.repository';

export type PostScope = 'feed' | 'all' | { userId: Id };
export type PostChange =
  | { type: 'created' }
  | { type: 'deleted'; id: Id }
  | { type: 'updated'; post: Post }
  | { type: 'following' };

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly changes = new Subject<PostChange>();
  readonly changes$ = this.changes.asObservable();

  constructor(private posts: PostRepository) {}

  list(page: number, scope: PostScope) { return this.posts.list(page, scope); }
  get(id: Id) { return this.posts.get(id); }

  create(content: string, file: File | null) {
    return this.posts.create(content, file).pipe(tap(() => this.changes.next({ type: 'created' })));
  }

  update(id: Id, content: string, file: File | null, remove: boolean) {
    return this.posts.update(id, content, file, remove);
  }

  delete(id: Id) {
    return this.posts.delete(id).pipe(tap(() => this.deleted(id)));
  }

  deleted(id: Id) { this.changes.next({ type: 'deleted', id }); }

  publish(post: Post) { this.changes.next({ type: 'updated', post }); }

  followingChanged() { this.changes.next({ type: 'following' }); }
}

