import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

assert.equal(typeof WebSocket, 'function', 'No Node 20, execute com --experimental-websocket.');

const base = new URL(process.argv[2] || 'http://localhost:4200');
assert.ok(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname));
const onboardingOnly = process.argv.includes('--onboarding');
const chrome = process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const scratch = resolve(tmpdir());
const profile = await mkdtemp(join(scratch, 'ecotech-chrome-'));
const browser = spawn(chrome, ['--headless=new', '--no-first-run', '--disable-gpu',
  '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
let browserError;
browser.on('error', error => { browserError = error; });
const accounts = [];
const pageErrors = [];
const failedRequests = [];
let ws;
let nextId = 0;
const mark = randomBytes(5).toString('hex');
const username = 'ui' + mark;
const password = randomBytes(8).toString('hex');
const content = 'Publicação EcoTech ' + mark;
const edited = 'Publicação editada ' + mark;

async function waitFor(read, label, timeout = 30000) {
  const end = Date.now() + timeout;
  do {
    if (browserError) throw browserError;
    const value = await read();
    if (value) return value;
    await delay(120);
  } while (Date.now() < end);
  throw new Error('Tempo esgotado: ' + label);
}

async function api(path, options = {}) {
  const response = await fetch(new URL('/api' + path, base), { signal: AbortSignal.timeout(20000), ...options });
  if (!response.ok) throw new Error(path + ' retornou ' + response.status);
  return response.status === 204 ? null : response.json();
}

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', received);
      reject(new Error('Chrome não respondeu a ' + method));
    }, 30000);
    function received(event) {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timer);
      ws.removeEventListener('message', received);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
    ws.addEventListener('message', received);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const answer = await cdp('Runtime.evaluate', { expression, returnByValue: true });
  if (answer.exceptionDetails) throw new Error('Falha na expressão de teste da página.');
  return answer.result.value;
}
const literal = JSON.stringify;
const ready = (text) => waitFor(() => evaluate('!!document.body?.innerText.includes(' + literal(text) + ')'), text);
const route = (path) => waitFor(() => evaluate('location.pathname === ' + literal(path)), path);
const visit = (path) => cdp('Page.navigate', { url: new URL(path, base).href });

async function fill(selector, value) {
  await waitFor(() => evaluate(`(() => {
    const input = document.querySelector(${literal(selector)});
    if (!input) return false;
    input.focus();
    input.value = ${literal(value)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`), selector);
}
async function button(label, scope = 'body') {
  return waitFor(() => evaluate(`(() => {
    const buttons = document.querySelectorAll(${literal(scope + ' button')});
    const button = [...buttons].find(node => node.textContent.trim().includes(${literal(label)}));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`), label);
}
async function link(label, scope = 'body') {
  return waitFor(() => evaluate(`(() => {
    const links = document.querySelectorAll(${literal(scope + ' a')});
    const link = [...links].find(node => node.textContent.trim().includes(${literal(label)}));
    if (!link) return false;
    link.click();
    return true;
  })()`), label);
}
async function login() {
  return api('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
}
async function dimensions(width, height, reducedMotion) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }] });
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Overflow em ' + width);
}

async function chooseFile(path) {
  const { root } = await cdp('DOM.getDocument');
  const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: '.welcome input[type="file"]' });
  assert.ok(nodeId, 'Campo de arquivo da etapa atual');
  await cdp('DOM.setFileInputFiles', { nodeId, files: [path] });
}

async function testOnboarding(account) {
  const headers = { Authorization: 'Bearer ' + account.accessToken };
  const imagePath = join(profile, 'ecotech-onboarding.png');
  const invalidImage = join(profile, 'ecotech-onboarding.txt');
  await writeFile(imagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTioAAAAASUVORK5CYII=', 'base64'));
  await writeFile(invalidImage, 'Arquivo de teste inválido');

  await button('Pular etapa');
  await ready('Escolha sua foto de perfil');
  await visit('/boas-vindas?etapa=foto');
  await ready('Escolha sua foto de perfil');
  await button('Pular etapa');
  await ready('Escolha sua foto de capa');
  const initial = await api('/users/me', { headers });
  assert.ok(!initial.city && !initial.bio && !initial.profileImageUrl && !initial.coverImageUrl);
  await button('Voltar');
  await ready('Escolha sua foto de perfil');
  await button('Voltar');
  await ready('Complete seu perfil');
  await dimensions(390, 844, true);

  await fill('input[name="city"]', 'São Paulo');
  await fill('input[name="website"]', 'https://example.test');
  await fill('textarea[name="bio"]', 'Perfil temporário para validar o pós-cadastro.');
  await button('Continuar', '.welcome-actions');
  await ready('Escolha sua foto de perfil');
  await chooseFile(invalidImage);
  await ready('Use uma imagem JPG, PNG ou WebP.');
  await chooseFile(imagePath);
  await waitFor(() => evaluate('document.querySelector(".avatar-preview img")?.src.startsWith("blob:")'), 'prévia da foto');
  await button('Salvar e continuar');
  await ready('Escolha sua foto de capa');
  const withPhoto = await api('/users/me', { headers });
  assert.ok(withPhoto.profileImageUrl && !withPhoto.coverImageUrl);
  await chooseFile(imagePath);
  await waitFor(() => evaluate('document.querySelector(".welcome-cover img")?.src.startsWith("blob:")'), 'prévia da capa');
  await button('Salvar e continuar');
  await ready('Tudo pronto para começar');

  const completed = await api('/users/me', { headers });
  assert.equal(completed.name, account.name);
  assert.equal(completed.username, username);
  assert.equal(completed.city, 'São Paulo');
  assert.equal(completed.website, 'https://example.test');
  assert.equal(completed.bio, 'Perfil temporário para validar o pós-cadastro.');
  assert.ok(completed.profileImageUrl && completed.coverImageUrl);
  await button('Ir para o feed');
  await route('/home');
  await visit('/conta');
  await link('Completar perfil');
  await ready('Complete seu perfil');
  assert.equal(await evaluate('document.querySelector("input[name=city]").value'), 'São Paulo');
  await button('Fazer depois');
  await route('/home');
  assert.deepEqual(pageErrors, []);
  console.log('Pós-cadastro OK: pulos, volta, recarga, dados, validação, foto, capa, feed e reabertura.');
}

try {
  assert.equal((await api('/actuator/health')).status, 'UP');
  const port = await waitFor(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]; }
    catch { return null; }
  }, 'inicialização do Chrome');
  const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') pageErrors.push(message.params.exceptionDetails.text);
    if (message.method === 'Network.responseReceived') {
      const { status, url } = message.params.response;
      const path = new URL(url).pathname;
      if (status >= 400 && path.startsWith('/api/')) failedRequests.push(path + ' ' + status);
    }
    if (message.method === 'Page.javascriptDialogOpening') {
      void cdp('Page.handleJavaScriptDialog', { accept: true });
    }
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await visit('/cadastro');
  await ready('Criar conta');
  await dimensions(390, 844, true);
  await fill('input[name="name"]', 'Conta de teste EcoTech');
  await fill('input[name="username"]', username);
  await fill('input[name="email"]', 'ecotech.' + username + '@example.test');
  await fill('input[name="password"]', password);
  await button('Criar conta');
  await route('/boas-vindas');
  await ready('Complete seu perfil');
  const account = await login();
  accounts.push(account);
  console.log('Cadastro e entrada automática OK');

  if (onboardingOnly) {
    await testOnboarding(account);
  } else {
    await button('Fazer depois');
    await route('/home');

    await fill('textarea[name="content"]', content);
    await button('Publicar');
    await ready('Publicação criada.');
    await link('Abrir publicação criada');
    await ready(content);
    const detail = await evaluate('location.pathname');
    await dimensions(768, 1024, false);
    await dimensions(1366, 900, false);
    await button('Curtir');
    await ready('1 curtidas');
    await fill('textarea[name="comment"]', 'Comentário smoke');
    await button('Comentar');
    await ready('Comentário smoke');
    await button('Editar comentário');
    await fill('textarea[name="edited"]', 'Comentário atualizado no navegador');
    await button('Salvar comentário');
    await ready('Comentário atualizado no navegador');
    await button('Editar', '.post-card .actions');
    await fill('textarea[name="content"]', edited);
    await button('Salvar', '.post-card form.subsection');
    await ready(edited);
    console.log('Criação, detalhe, curtida e edição de publicação e comentário OK');

    await visit(detail);
    await ready(edited);
    await ready('Comentário atualizado no navegador');
    await button('Compartilhar');
    assert.equal(await evaluate('document.querySelector(".post-card input[readonly]").value'), new URL(detail, base).href);
    await fill('input[type="search"]', username);
    await link('Conta de teste EcoTech', '.search-results');
    await route('/perfil/' + account.id);
    await button('Editar perfil');
    await fill('input[name="city"]', 'São Paulo');
    await button('Salvar dados');
    await ready('Dados do perfil salvos.');
    await button('Modo escuro');
    assert.ok(await evaluate('document.querySelector(".app-shell").classList.contains("dark-mode")'));
    await dimensions(390, 844, true);
    console.log('Reload, link compartilhável, busca, perfil, modo escuro e larguras 390/768/1366 OK');

    await button('Sair');
    await route('/login');
    await visit(detail);
    await route('/login');
    await ready('Entrar');
    await fill('input[name="username"]', username);
    await fill('input[name="password"]', password);
    await button('Entrar');
    await route(detail);
    await ready(edited);
    await button('Excluir comentário');
    await ready('Comentário excluído.');
    await button('Excluir', '.post-card .actions');
    await ready('Publicação excluída.');
    assert.deepEqual(pageErrors, []);
    console.log('Logout, proteção da rota, retorno ao link e exclusões OK');
  }
} catch (error) {
  const alerts = ws?.readyState === WebSocket.OPEN
    ? await evaluate('Array.from(document.querySelectorAll("[role=alert]"), node => node.textContent.trim())').catch(() => [])
    : [];
  console.error('Alertas:', alerts, 'Respostas HTTP:', failedRequests, 'Erros da página:', pageErrors);
  throw error;
} finally {
  if (!accounts.length) {
    try { accounts.push(await login()); } catch { /* Cadastro pode não ter sido concluído. */ }
  }
  for (const account of accounts) {
    const headers = { Authorization: 'Bearer ' + account.accessToken };
    try {
      const page = await api('/posts/user/' + account.id, { headers });
      for (const post of page.content.filter(post => post.content.includes(mark))) {
        await api('/posts/' + post.id, { method: 'DELETE', headers });
      }
      await api('/users/' + account.id, { method: 'DELETE', headers });
      console.log('Conta temporária removida ' + account.username);
    } catch (error) {
      console.error('Limpeza pendente para ' + account.username + ': ' + error.message);
      process.exitCode = 1;
    }
  }
  ws?.close();
  if (!browser.killed) browser.kill();
  await delay(400);
  if (dirnameIsScratch(profile)) await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
}

function dirnameIsScratch(path) {
  return resolve(path).startsWith(scratch + sep + 'ecotech-chrome-');
}
