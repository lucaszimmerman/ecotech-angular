import { Injectable } from '@angular/core';
import { Id } from '../../data/api-models';
import { CommentRepository } from '../../data/repositories/comment.repository';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private comments: CommentRepository) {}
  list(id: Id, page: number) { return this.comments.list(id, page); }
  get(postId: Id, id: Id) { return this.comments.get(postId, id); }
  count(id: Id) { return this.comments.count(id); }
  create(id: Id, content: string) { return this.comments.create(id, content); }
  update(postId: Id, id: Id, content: string) { return this.comments.update(postId, id, content); }
  delete(postId: Id, id: Id) { return this.comments.delete(postId, id); }
}
