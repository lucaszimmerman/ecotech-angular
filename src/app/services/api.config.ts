function meta(name: string) {
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim() || '';
}

/** Caminho da API usado pelo navegador. Na Vercel e no `ng serve`, `/api` é encaminhado ao backend. */
export const API_BASE_URL = (meta('ecotech-api') || '/api').replace(/\/+$/, '');

/**
 * Endereço direto do backend, usado só para iniciar o login com Google.
 * O OAuth guarda o estado num cookie do próprio backend, por isso não passa pelo `/api`.
 * Deixe vazio para esconder o botão do Google.
 */
export const API_ORIGIN = meta('ecotech-api-origin').replace(/\/+$/, '');

/** Fuso das datas sem offset enviadas pela API. O backend grava em UTC. Use `local` só se a API não estiver em UTC. */
export const API_TIMEZONE = meta('ecotech-api-timezone') || 'UTC';

/** O Render gratuito pode levar quase um minuto para acordar a API. */
export const API_TIMEOUT_MS = 90000;

/** Depois desse tempo sem resposta, a tela avisa que o servidor está iniciando. */
export const API_SLOW_NOTICE_MS = 4000;

export const FEATURES = {
  /** Confirmação de e-mail e recuperação de senha dependem do SES. Mude para `true` quando o envio estiver validado. */
  emailFlows: false,
  googleLogin: !!API_ORIGIN,
};

export const GOOGLE_LOGIN_URL = API_ORIGIN + '/oauth2/authorization/google';
