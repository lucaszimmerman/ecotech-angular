import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { Post, UserSummary } from '../../data/api-models';
import { IMAGE_TYPES, MediaService } from '../../data/media.service';
import { AuthService } from '../../services/auth.service/auth.service';
import { LikesService } from '../../services/likes.service/likes.service';
import { PostService } from '../../services/post.service/post.service';
import {
  Paginated,
  RequestState,
  trackId,
  uncertain,
} from '../../shared/request-state';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PostComponent {
  @Input({ required: true }) post!: Post;
  @Input() showComments = false;
  readonly like = new RequestState();
  readonly status = new RequestState();
  readonly edit = new RequestState();
  readonly remove = new RequestState();
  readonly mediaRequest = new RequestState();
  readonly likers = new Paginated<UserSummary>((page) =>
    this.likes.list(this.post.id, page),
  );
  readonly types = IMAGE_TYPES;
  readonly trackId = trackId;
  showLikers = false;
  showShare = false;
  shareLink = '';
  copied = false;
  copyFailed = false;
  editing = false;
  content = '';
  file: File | null = null;
  preview = '';
  removeImage = false;
  refreshNeeded = false;
  imageRetried = false;
  imageFailed = false;
  likeUnknown = false;

  /** Elementos que têm ação própria e não devem abrir a publicação ao serem clicados. */
  private static readonly OWN_ACTION = 'a, button, input, textarea, select, label, form, app-menu, app-comments, .subsection';

  get isOpen() {
    return this.router.url.split(/[?#]/)[0] === `/post/${this.post.id}`;
  }

  /** Clicar em qualquer área livre do card abre a publicação, como em outras redes sociais. */
  openPost(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isOpen || this.editing || target.closest(PostComponent.OWN_ACTION)) return;
    if (window.getSelection()?.toString()) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/post', this.post.id]));
    if (event.ctrlKey || event.metaKey) window.open(url, '_blank', 'noopener');
    else void this.router.navigateByUrl(url);
  }

  constructor(
    private auth: AuthService,
    private posts: PostService,
    private likes: LikesService,
    private media: MediaService,
    private router: Router,
  ) {}

  get canEdit() {
    const viewer = this.auth.currentUserValue;
    return viewer?.id === this.post.user.id || viewer?.role === 'ADMIN';
  }

  toggleLike() {
    if (this.likeUnknown || this.status.busy) return;
    const value = !this.post.likedByCurrentUser;
    this.like.run(
      this.likes.set(this.post.id, value),
      () => {
        this.post.likedByCurrentUser = value;
        this.post.likeCount = Math.max(
          0,
          this.post.likeCount + (value ? 1 : -1),
        );
        this.refreshLike();
      },
      () => this.refreshLike(),
    );
  }

  refreshLike() {
    this.likeUnknown = true;
    this.status.run(this.likes.status(this.post.id), (state) => {
      Object.assign(this.post, state);
      this.likeUnknown = false;
      if (this.showLikers) this.likers.reset();
    });
  }

  toggleLikers() {
    this.showLikers = !this.showLikers;
    if (this.showLikers) this.likers.reset();
    else this.likers.request.reset();
  }

  share() {
    this.showShare = !this.showShare;
    this.copied = this.copyFailed = false;
    const tree = this.router.createUrlTree(['/post', this.post.id]);
    const path = this.router.serializeUrl(tree).replace(/^\//, '');
    this.shareLink = new URL(path, document.baseURI).href;
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.copied = true;
    } catch {
      this.copied = false;
      this.copyFailed = true;
    }
  }

  startEditing() {
    this.editing = !this.editing;
    if (!this.editing) this.clearImage();
    this.content = this.post.content;
    this.removeImage = false;
    this.edit.error = '';
    this.edit.success = '';
  }

  choose(input: HTMLInputElement) {
    this.clearImage();
    const file = input.files?.item(0);
    if (!file) return;
    this.edit.error = this.media.validate(file);
    if (this.edit.error) {
      input.value = '';
      return;
    }
    this.file = file;
    this.removeImage = false;
    this.preview = URL.createObjectURL(file);
  }

  save() {
    let written = false;
    this.edit.run(
      this.posts
        .update(this.post.id, this.content.trim(), this.file, this.removeImage)
        .pipe(
          switchMap(() => {
            written = true;
            return this.posts.get(this.post.id);
          }),
        ),
      (post) => {
        this.applyPost(post);
        this.editing = false;
        this.clearImage();
        this.edit.success = 'Publicação atualizada.';
      },
      (error) => {
        this.refreshNeeded = written || uncertain(error);
        if (this.refreshNeeded)
          this.edit.error += written
            ? ' A publicação foi salva. Atualize para ver o resultado.'
            : ' Atualize a publicação para conferir se ela foi salva.';
      },
    );
  }

  reload() {
    this.edit.run(this.posts.get(this.post.id), (post) => {
      this.applyPost(post);
      this.refreshNeeded = false;
    });
  }

  delete() {
    if (!window.confirm('Excluir esta publicação?')) return;
    this.remove.run(
      this.posts.delete(this.post.id),
      () => {},
      (error) => {
        if (
          uncertain(error) ||
          (error instanceof HttpErrorResponse && error.status === 404)
        ) {
          this.checkDeleted();
        }
      },
    );
  }

  private checkDeleted() {
    this.edit.run(
      this.posts.get(this.post.id),
      (post) => this.applyPost(post),
      (error) => {
        if (error instanceof HttpErrorResponse && error.status === 404)
          this.posts.deleted(this.post.id);
      },
    );
  }

  renewImage() {
    this.imageFailed = true;
    if (this.imageRetried) return;
    this.imageRetried = true;
    this.mediaRequest.run(this.posts.get(this.post.id), (post) => {
      if (post.imageUrl && post.imageUrl !== this.post.imageUrl) {
        this.post.imageUrl = post.imageUrl;
        this.imageFailed = false;
      }
    });
  }

  avatarFailed(event: Event) {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/assets/avatar.svg'))
      image.src = 'assets/avatar.svg';
  }

  ngOnDestroy() {
    this.clearImage();
  }

  private applyPost(post: Post) {
    const changed = this.post.imageUrl !== post.imageUrl;
    this.post = post;
    if (changed) {
      this.imageFailed = false;
      this.imageRetried = false;
    }
    this.posts.publish(post);
  }

  private clearImage() {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.preview = '';
    this.file = null;
  }
}
