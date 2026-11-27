import { Injectable } from '@angular/core';

export const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';
export const DEFAULT_AVATAR = 'assets/avatar.svg';

@Injectable({ providedIn: 'root' })
export class MediaService {
  resolve(value?: string | null, fallback = DEFAULT_AVATAR): string {
    if (!value) return fallback;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? value : fallback;
    } catch {
      return fallback;
    }
  }

  validate(file: File): string {
    if (!IMAGE_TYPES.split(',').includes(file.type)) return 'Use uma imagem JPG, PNG ou WebP.';
    if (!file.size || file.size > 5 * 1024 * 1024) return 'Escolha um arquivo de até 5 MB.';
    return '';
  }
}
