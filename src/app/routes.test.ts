import test from 'node:test';
import assert from 'node:assert/strict';
import { routeFromPath, pathForRoute, PATH_ROUTES } from './routes';

test('Routage : chaque route publique déclarée est résolue', () => {
  for (const [path, expected] of Object.entries(PATH_ROUTES)) {
    assert.deepEqual(routeFromPath(path), { route: expected, section: 'dashboard' }, `échec sur ${path}`);
  }
});

test('Routage : la barre oblique finale et les répétitions sont tolérées', () => {
  assert.deepEqual(routeFromPath('/'), { route: 'landing', section: 'dashboard' });
  assert.deepEqual(routeFromPath('/apercu/'), { route: 'preview', section: 'dashboard' });
  assert.deepEqual(routeFromPath('/tarifs///'), { route: 'pricing', section: 'dashboard' });
});

test('Routage : un chemin inconnu renvoie 404 et JAMAIS la page d’accueil', () => {
  const unknown = ['/page-inexistante', '/tarif', '/apercu-2025', '/fonctionnalite', '/xyz/abc'];
  for (const path of unknown) {
    const resolved = routeFromPath(path);
    assert.equal(resolved.route, 'notfound', `« ${path} » ne doit pas retomber sur la landing`);
  }
});

test('Routage : une sous-section inconnue de /app retombe sur le tableau de bord', () => {
  assert.deepEqual(routeFromPath('/app'), { route: 'app', section: 'dashboard' });
  assert.deepEqual(routeFromPath('/app/inconnue'), { route: 'app', section: 'dashboard' });
  assert.deepEqual(routeFromPath('/app/settings'), { route: 'app', section: 'settings' });
  assert.deepEqual(routeFromPath('/app/backup/'), { route: 'app', section: 'backup' });
});

test('Routage : pathForRoute est l’inverse de routeFromPath', () => {
  for (const [path, route] of Object.entries(PATH_ROUTES)) {
    assert.equal(pathForRoute(route), path);
  }
});

test('Routage : /app n’est jamais confondu avec une route publique préfixée', () => {
  assert.equal(routeFromPath('/appstore').route, 'notfound');
  assert.equal(routeFromPath('/application').route, 'notfound');
});
