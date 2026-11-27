import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Comment, Id } from '../../data/api-models';
import { AuthService } from '../../services/auth.service/auth.service';
import { CommentService } from '../../services/comment-service/comment.service';
import {
  Paginated,
  RequestState,
  trackId,
  uncertain,
} from '../../shared/request-state';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CommentsComponent implements OnChanges {
  @Input({ required: true }) postId!: Id;
  @Output() countChanged = new EventEmitter<number>();
  readonly mutation = new RequestState();
  readonly details = new RequestState();
  readonly trackId = trackId;
  readonly results = new Paginated<Comment>((page) =>
    this.comments.list(this.postId, page),
  );
  readonly count = new RequestState();
  draft = '';
  editing: Id | null = null;
  editText = '';
  requiresCheck = false;

  constructor(
    private comments: CommentService,
    private auth: AuthService,
  ) {}

  ngOnChanges() {
    this.mutation.reset();
    this.details.reset();
    this.count.reset();
    this.draft = '';
    this.editing = null;
    this.requiresCheck = false;
    this.results.reset();
  }

  canEdit(item: Comment) {
    const viewer = this.auth.currentUserValue;
    return viewer?.role === 'ADMIN' || viewer?.id === item.user.id;
  }

  create() {
    this.mutation.run(
      this.comments.create(this.postId, this.draft.trim()),
      () => {
        this.draft = '';
        this.mutation.success = 'Comentário publicado.';
        this.reload();
      },
      (error) => this.check(error),
    );
  }

  openEdit(item: Comment) {
    if (this.editing === item.id) {
      this.editing = null;
      return;
    }
    this.details.run(this.comments.get(this.postId, item.id), (current) => {
      this.editing = current.id;
      this.editText = current.content;
    });
  }

  save() {
    if (!this.editing) return;
    const id = this.editing;
    const content = this.editText.trim();
    this.mutation.run(
      this.comments.update(this.postId, id, content),
      () => {
        this.results.items = this.results.items.map((item) =>
          item.id === id ? { ...item, content } : item,
        );
        this.editing = null;
        this.mutation.success = 'Comentário atualizado.';
      },
      (error) => this.check(error),
    );
  }

  delete(item: Comment) {
    if (!window.confirm('Excluir este comentário?')) return;
    this.mutation.run(
      this.comments.delete(this.postId, item.id),
      () => {
        this.editing = null;
        this.mutation.success = 'Comentário excluído.';
        this.reload();
      },
      (error) => this.check(error),
    );
  }

  reload() {
    this.results.reset();
    this.count.run(this.comments.count(this.postId), (count) =>
      this.countChanged.emit(count),
    );
  }

  private check(error: unknown) {
    if (!uncertain(error)) return;
    this.mutation.error +=
      ' Confira a lista atualizada antes de repetir a ação.';
    this.requiresCheck = true;
    this.reload();
  }
}
