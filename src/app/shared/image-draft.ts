/**
 * Imagem escolhida pelo usuário e ainda não enviada. Guarda o arquivo, o tipo
 * (por exemplo `profile` ou `cover`) e uma URL local para pré-visualização.
 * Chame `clear()` ao cancelar, enviar ou destruir o componente para liberar a memória.
 */
export class ImageDraft<K extends string = string> {
  kind: K | null = null;
  file: File | null = null;
  preview = '';

  set(kind: K, file: File) {
    this.clear();
    this.kind = kind;
    this.file = file;
    this.preview = URL.createObjectURL(file);
  }

  /** Pré-visualização para o tipo pedido, ou `null` se o rascunho for de outro tipo. */
  previewFor(kind: K) {
    return this.kind === kind ? this.preview : null;
  }

  clear() {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.kind = null;
    this.file = null;
    this.preview = '';
  }
}
