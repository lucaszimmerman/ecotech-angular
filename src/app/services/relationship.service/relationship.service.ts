import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, switchMap, of, tap } from 'rxjs';
import { Id } from '../../data/api-models';
import { RelationshipRepository } from '../../data/repositories/relationship.repository';
import { PostService } from '../post.service/post.service';

@Injectable({ providedIn: 'root' })
export class RelationshipService {
  constructor(private relationships: RelationshipRepository, private posts: PostService) {}

  list(id: Id, kind: 'followers' | 'following', page: number) {
    return this.relationships.list(id, kind, page);
  }

  /** Totais de seguidores e seguindo, lidos do `totalElements` de uma página mínima. */
  counts(id: Id): Observable<{ followers: number; following: number }> {
    return forkJoin({
      followers: this.relationships.list(id, 'followers', 0, 1),
      following: this.relationships.list(id, 'following', 0, 1),
    }).pipe(map(({ followers, following }) => ({ followers: followers.totalElements, following: following.totalElements })));
  }

  follows(viewer: Id, target: Id, page = 0): Observable<boolean> {
    return this.relationships.list(viewer, 'following', page, 100).pipe(
      switchMap(result => {
        if (result.content.some(user => user.id === target)) return of(true);
        return result.last || result.number + 1 >= result.totalPages ? of(false) : this.follows(viewer, target, result.number + 1);
      })
    );
  }

  set(id: Id, following: boolean) {
    return this.relationships.set(id, following).pipe(tap(() => this.posts.followingChanged()));
  }
}
