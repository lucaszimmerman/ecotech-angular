import { Pipe, PipeTransform } from '@angular/core';
import { MediaService } from '../data/media.service';

@Pipe({
    name: 'mediaUrl',
    standalone: false
})
export class MediaUrlPipe implements PipeTransform {
  constructor(private media: MediaService) {}

  transform(value?: string | null, fallback?: string) { return this.media.resolve(value, fallback); }
}
