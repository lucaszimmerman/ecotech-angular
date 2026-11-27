import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { Post } from '../../data/api-models';
import { PostService } from '../../services/post.service/post.service';
import { RequestState } from '../../shared/request-state';

@Component({
  selector: 'app-post-page',
  templateUrl: './post-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PostPageComponent {
  readonly request = new RequestState();
  id = '';
  post?: Post;

  constructor(
    route: ActivatedRoute,
    private posts: PostService,
  ) {
    route.paramMap
      .pipe(
        map((params) => params.get('id') || ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        this.request.reset();
        this.post = undefined;
        this.id = id;
        this.load();
      });
    this.posts.changes$.pipe(takeUntilDestroyed()).subscribe((change) => {
      if (change.type === 'updated' && change.post.id === this.id)
        this.post = change.post;
      if (change.type === 'deleted' && change.id === this.id) {
        this.post = undefined;
        this.request.success = 'Publicação excluída.';
      }
    });
  }

  load() {
    this.request.run(this.posts.get(this.id), (post) => {
      this.post = post;
    });
  }
}
