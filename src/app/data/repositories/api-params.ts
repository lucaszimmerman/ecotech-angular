import { HttpParams } from '@angular/common/http';

export function pageParams(page: number, size = 20): HttpParams {
  return new HttpParams({ fromObject: { page, size } });
}

export function imageForm(file: File): FormData {
  const form = new FormData();
  form.append('file', file);
  return form;
}

export function postForm(content: string, file?: File | null, removeImage = false): FormData {
  const form = file ? imageForm(file) : new FormData();
  form.append('content', content);
  if (removeImage) form.append('removeImage', 'true');
  return form;
}
