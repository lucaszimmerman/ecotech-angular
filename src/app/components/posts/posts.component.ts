import {
  Component,
  Input,
  OnChanges,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Post } from '../../data/api-models';
import {
  PostScope,
  PostService,
} from '../../services/post.service/post.service';
import { Paginated, trackId } from '../../shared/request-state';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PostsComponent implements OnChanges, OnInit {
  @Input() scope: PostScope = 'feed';
  /** Esconde o título quando a página já mostra o contexto (por exemplo, a aba do perfil). */
  @Input() showTitle = true;
  readonly results = new Paginated<Post>((page) =>
    this.posts.list(page, this.scope),
  );
  readonly trackId = trackId;
  pending = false;
  notice = '';

  constructor(private posts: PostService) {
    this.posts.changes$.pipe(takeUntilDestroyed()).subscribe((change) => {
      if (
        change.type === 'deleted' &&
        this.results.items.some((post) => post.id === change.id)
      ) {
        this.results.items = this.results.items.filter(
          (post) => post.id !== change.id,
        );
        this.notice = 'Publicação excluída.';
      }
      if (change.type === 'updated')
        this.results.items = this.results.items.map((post) =>
          post.id === change.post.id ? change.post : post,
        );
      if (
        (change.type === 'created' && this.scope !== 'feed') ||
        (change.type === 'following' && this.scope === 'feed')
      ) {
        if (this.results.page <= 1) this.reload();
        else this.pending = true;
      }
    });
  }

  ngOnChanges() {
    this.reload();
  }
  ngOnInit() {
    if (!this.results.request.busy && this.results.total === null)
      this.reload();
  }

  get title() {
    return this.scope === 'feed'
      ? 'Publicações de quem você segue'
      : 'Publicações';
  }

  reload() {
    this.pending = false;
    this.notice = '';
    this.results.reset();
  }
}
