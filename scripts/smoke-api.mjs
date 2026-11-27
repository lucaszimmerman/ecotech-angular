import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const base = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const skipImages = process.argv.includes('--skip-images');
const host = new URL(base);
assert.ok(host.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(host.hostname),
  'Use somente a API local de desenvolvimento.');
const mark = randomBytes(6).toString('hex');
const password = randomBytes(8).toString('hex');
const nextPassword = randomBytes(9).toString('hex');
const accounts = [];
const failures = [];
let postId;
let owner;
const image = new Blob([Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTioAAAAASUVORK5CYII=', 'base64'
)], { type: 'image/png' });

function input(suffix, secret = password) {
  return { username: 'e2e' + mark + suffix, name: 'EcoTech smoke ' + suffix,
    email: 'ecotech.' + mark + suffix + '@example.test', password: secret };
}
function multipart(content, file = false, remove = false) {
  const body = new FormData();
  if (content) body.append('content', content);
  if (file) body.append('file', image, 'smoke.png');
  if (remove) body.append('removeImage', 'true');
  return body;
}

async function request(method, path, expected, token, body) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(base + path, {
    method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(35000)
  });
  assert.ok([expected].flat().includes(response.status), method + ' ' + path.split('?')[0] +
    ' retornou ' + response.status + ' (esperado ' + expected + ')');
  const content = await response.text();
  return {
    body: response.headers.get('content-type')?.includes('json') && content ? JSON.parse(content) : content,
    location: response.headers.get('location')
  };
}

async function probe(id, run) {
  try {
    const result = await run();
    console.log(id + ' OK');
    return result;
  } catch (error) {
    failures.push(id);
    console.log(id + ' FALHOU ' + error.message);
    return undefined;
  }
}
async function register(suffix, secret) {
  const payload = input(suffix, secret);
  const { body } = await request('POST', '/auth/register', 201, null, payload);
  accounts.push(body);
  assert.match(body.id, /^[\da-f-]{36}$/);
  return body;
}

try {
  await probe('health', () => request('GET', '/actuator/health', 200));
  await probe('OpenAPI', async () => {
    const { body } = await request('GET', '/v3/api-docs', 200);
    console.log('Operações OpenAPI ' + Object.values(body.paths).flatMap(Object.keys).length);
  });
  owner = await probe('E02', () => register('a'));
  const reader = await probe('E02 segunda conta', () => register('b'));
  assert.ok(owner && reader, 'Cadastro necessário para as operações autenticadas.');
  const a = owner.accessToken;
  const b = reader.accessToken;
  const user = '/users/' + owner.id;
  const readerPath = '/users/' + reader.id;

  await probe('E01', async () => {
    await request('POST', '/auth/login', 200, null, { username: owner.username, password });
    await request('POST', '/auth/login', 401, null, { username: owner.username, password: 'senha incorreta' });
  });
  const longPassword = randomBytes(16).toString('hex');
  const long = await probe('E02 senha com mais de 20 caracteres', () => register('long', longPassword));
  if (long) await probe('E01 senha com mais de 20 caracteres', () =>
    request('POST', '/auth/login', 200, null, { username: long.username, password: longPassword }));
  await probe('E03', async () => {
    const payload = input('c');
    const created = await request('POST', '/users', 201, a, payload);
    const { body } = await request('POST', '/auth/login', 200, null, { username: payload.username, password });
    accounts.push(body);
    assert.ok(created.location?.endsWith('/' + body.id));
    assert.equal(created.body, '');
  });
  await probe('E04', async () => {
    const me = await request('GET', '/users/me', 200, a);
    assert.equal(me.body.id, owner.id);
    await request('GET', '/users/me', 401);
  });
  await probe('E05', async () => {
    await request('GET', user, 200, a);
    await request('GET', user, 403, b);
  });
  await probe('E06', async () => {
    const { body } = await request('GET', user + '/profile', 200, b);
    assert.equal(body.id, owner.id);
    assert.equal(Object.hasOwn(body, 'email'), false);
  });
  await probe('E07 autorização de usuário comum', () => request('GET', '/users', 403, a));
  await probe('E08', async () => {
    const { body } = await request('GET', '/users/search?q=' + owner.username + '&page=0&size=1', 200, b);
    assert.equal(body.content[0].id, owner.id);
  });
  await probe('E09', async () => {
    await request('PUT', user, 204, a, { username: owner.username, name: 'EcoTech smoke updated', city: 'São Paulo', website: '', bio: 'Perfil de teste' });
    assert.equal((await request('GET', '/users/me', 200, a)).body.bio, 'Perfil de teste');
    await request('PUT', user, 403, b, { username: owner.username, name: 'EcoTech smoke updated' });
  });
  await probe('E11', async () => {
    await request('PATCH', '/users/me/password', 204, a, {
      currentPassword: password, newPassword: nextPassword, confirmPassword: nextPassword
    });
    await request('POST', '/auth/login', 200, null, { username: owner.username, password: nextPassword });
  });
  if (!skipImages) {
    await probe('E12', async () => {
      await request('PATCH', '/users/me/profile-image', 204, a, multipart(null, true));
      assert.ok((await request('GET', '/users/me', 200, a)).body.profileImageUrl);
    });
    await probe('E13', async () => {
      await request('PATCH', '/users/me/cover-image', 204, a, multipart(null, true));
      assert.ok((await request('GET', '/users/me', 200, a)).body.coverImageUrl);
    });
  }
  await probe('E14', () => request('POST', user + '/follow', 204, b));
  await probe('E16', async () => {
    const { body } = await request('GET', user + '/followers?page=0&size=1', 200, a);
    assert.equal(body.content[0].id, reader.id);
  });
  await probe('E17', async () => {
    const { body } = await request('GET', readerPath + '/following?page=0&size=1', 200, b);
    assert.equal(body.content[0].id, owner.id);
  });
  await probe('E18', async () => {
    const created = await request('POST', '/posts', 201, a, multipart('EcoTech smoke ' + mark));
    postId = created.location?.split('/').at(-1);
    assert.match(postId || '', /^[\da-f-]{36}$/);
    assert.equal(created.body, '');
  });
  if (postId) {
    const post = '/posts/' + postId;
    const comments = post + '/comments';
    const likes = post + '/likes';
    for (const [id, path] of [['E19', '/posts'], ['E20', '/posts/feed'], ['E21', '/posts/user/' + owner.id]]) {
      await probe(id, async () => {
        const { body } = await request('GET', path + '?page=0&size=20', 200, b);
        assert.ok(body.content.some(item => item.id === postId));
      });
    }
    await probe('E22', async () => {
      const { body } = await request('GET', post, 200, b);
      assert.equal(body.content, 'EcoTech smoke ' + mark);
      assert.equal(body.likedByCurrentUser, false);
    });
    await probe('E23 texto e autorização', async () => {
      await request('PUT', post, 204, a, multipart('Texto editado ' + mark));
      await request('PUT', post, 403, b, multipart('Texto indevido ' + mark));
      assert.equal((await request('GET', post, 200, a)).body.content, 'Texto editado ' + mark);
    });
    if (!skipImages) await probe('E23 anexar e remover imagem', async () => {
      await request('PUT', post, 204, a, multipart('Imagem editada ' + mark, true));
      assert.ok((await request('GET', post, 200, a)).body.imageUrl);
      await request('PUT', post, 204, a, multipart('Imagem removida ' + mark, false, true));
      assert.equal((await request('GET', post, 200, a)).body.imageUrl, null);
    });
    await probe('E25', () => request('POST', likes, 204, b));
    await probe('E27', async () => {
      const { body } = await request('GET', likes + '?page=0&size=1', 200, a);
      assert.equal(body.content[0].id, reader.id);
    });
    await probe('E28', async () => {
      const { body } = await request('GET', likes + '/status', 200, b);
      assert.equal(body.likedByCurrentUser, true);
      assert.equal(body.likeCount, 1);
    });
    await probe('E26', () => request('DELETE', likes, 204, b));
    const comment = await probe('E29', async () => {
      const { location, body } = await request('POST', comments, 201, b, { content: 'Comentário de teste' });
      assert.equal(body, '');
      assert.ok(location?.includes('/comments/'));
      return comments + '/' + location.split('/').at(-1);
    });
    await probe('E30', async () => {
      const { body } = await request('GET', comments + '?page=0&size=1', 200, a);
      assert.equal(body.content[0].content, 'Comentário de teste');
    });
    await probe('E31', async () => {
      assert.equal((await request('GET', comments + '/count', 200, a)).body, 1);
    });
    if (comment) {
      await probe('E32', () => request('GET', comment, 200, a));
      await probe('E33', async () => {
        await request('PUT', comment, 403, a, { content: 'Edição indevida' });
        await request('PUT', comment, 204, b, { content: 'Comentário editado' });
        assert.equal((await request('GET', comment, 200, b)).body.content, 'Comentário editado');
      });
      await probe('E34', async () => {
        await request('DELETE', comment, 403, a);
        await request('DELETE', comment, 204, b);
        await request('GET', comment, 404, b);
      });
    }
    await probe('E15', () => request('DELETE', user + '/follow', 204, b));
    await probe('E24', async () => {
      await request('DELETE', post, 403, b);
      await request('DELETE', post, 204, a);
      postId = undefined;
      await request('GET', post, 404, a);
    });
  }
  await probe('E35 token inválido', () => request('GET', '/auth/verify-email?token=invalid-' + mark, [400, 404, 422]));
  await probe('E36 proteção da rota', () => request('POST', '/auth/resend-verification', 401));
  await probe('E37 email inexistente', () => request('POST', '/auth/forgot-password', 204, null, { email: 'absent.' + mark + '@example.test' }));
  await probe('E38 token inválido', () => request('POST', '/auth/reset-password', 422, null, {
    token: 'invalid-' + mark, newPassword: password, confirmPassword: password
  }));
  if (!base.endsWith('/api')) {
    await probe('OAuth início, sem seguir redirecionamento', () => request('GET', '/oauth2/authorization/google', 302));
  }
  console.log('Envio e recebimento de e-mail exigem destinatário controlado e SES configurado.');
} catch (error) {
  failures.push('fluxo');
  console.error(error.message);
} finally {
  if (postId && owner) await probe('limpeza post', () =>
    request('DELETE', '/posts/' + postId, [204, 404], owner.accessToken));
  for (const account of accounts) {
    await probe('E10 limpeza ' + account.username, () =>
      request('DELETE', '/users/' + account.id, 204, account.accessToken));
  }
  process.exitCode = failures.length ? 1 : 0;
  console.log(failures.length ? 'Falhas: ' + failures.join(', ') : 'Smoke concluído.');
}
