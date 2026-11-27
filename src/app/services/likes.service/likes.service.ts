import { Injectable } from '@angular/core';
import { Id } from '../../data/api-models';
import { LikeRepository } from '../../data/repositories/like.repository';

@Injectable({ providedIn: 'root' })
export class LikesService {
  constructor(private likes: LikeRepository) {}
  list(id: Id, page: number) { return this.likes.list(id, page); }
  status(id: Id) { return this.likes.status(id); }
  set(id: Id, value: boolean) { return this.likes.set(id, value); }
}
