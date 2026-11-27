import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IMAGE_TYPES, MediaService } from '../../data/media.service';
import { PostService } from '../../services/post.service/post.service';
import { RequestState, uncertain } from '../../shared/request-state';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ShareComponent {
  readonly request = new RequestState();
  readonly types = IMAGE_TYPES;
  content = '';
  file: File | null = null;
  preview = '';
  unknown = false;
  createdId = '';

  constructor(
    private posts: PostService,
    private media: MediaService,
  ) {}

  choose(input: HTMLInputElement) {
    this.clearImage();
    const file = input.files?.item(0);
    if (!file) return;
    this.request.error = this.media.validate(file);
    if (this.request.error) {
      input.value = '';
      return;
    }
    this.file = file;
    this.preview = URL.createObjectURL(file);
  }

  clearImage() {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.preview = '';
    this.file = null;
  }

  ngOnDestroy() {
    this.clearImage();
  }

  publish(input: HTMLInputElement) {
    if (this.unknown) return;
    this.createdId = '';
    this.request.run(
      this.posts.create(this.content.trim(), this.file),
      (response) => {
        const id = response.headers.get('Location')?.split('/').pop() || '';
        if (/^[0-9a-f-]{36}$/i.test(id)) this.createdId = id;
        this.content = '';
        this.clearImage();
        input.value = '';
        this.request.success = 'Publicação criada.';
      },
      (error) => {
        if (uncertain(error)) {
          this.unknown = true;
          this.request.error +=
            ' Confira suas publicações antes de enviar novamente.';
        }
      },
    );
  }
}
