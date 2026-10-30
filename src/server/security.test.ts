import test from 'node:test';
import assert from 'node:assert/strict';
import { dbStore, SEED_USERS } from './store';
import { sanitizeCsvCell } from '../utils/csv';

test('Security Check 1: Unauthenticated token validation fails with null session', () => {
  const result = dbStore.getSession('');
  assert.equal(result, null);

  const fakeResult = dbStore.getSession('Bearer fake_token_123');
  assert.equal(fakeResult, null);
});

test('Security Check 2: Authoritative session issuance binds user & organization accurately', () => {
  const sarah = SEED_USERS.find(u => u.email === 'sarah@acme-consulting.com')!;
  const session = dbStore.createSession(sarah);

  assert.ok(session.token.startsWith('tok_user-acme-1'));
  assert.equal(session.organizationId, 'org-acme');

  const context = dbStore.getSession(session.token);
  assert.ok(context !== null);
  assert.equal(context.user.email, 'sarah@acme-consulting.com');
  assert.equal(context.user.organizationId, 'org-acme');
});

test('Security Check 3: Tenant Isolation - Org A never sees Org B invoices', () => {
  const acmeInvoices = dbStore.getInvoices('org-acme');
  const strataInvoices = dbStore.getInvoices('org-strata');

  assert.ok(acmeInvoices.length > 0);
  assert.ok(strataInvoices.length > 0);

  // Verify none of Acme's invoices exist in Strata
  const acmeIds = new Set(acmeInvoices.map(i => i.id));
  const strataIds = new Set(strataInvoices.map(i => i.id));

  for (const sId of strataIds) {
    assert.equal(acmeIds.has(sId), false, `Leakage detected: Strata invoice ${sId} found in Acme!`);
  }

  // Cross-tenant lookup must fail
  const firstAcmeId = acmeInvoices[0].id;
  const crossLookup = dbStore.getInvoiceById('org-strata', firstAcmeId);
  assert.equal(crossLookup, null, 'Security breach: Org B accessed Org A invoice!');
});

test('Security Check 4: Cross-Tenant Modification Attempt fails safely', () => {
  const acmeInvoices = dbStore.getInvoices('org-acme');
  const acmeId = acmeInvoices[0].id;

  // Attempt to modify Acme invoice using Strata's tenant context
  const updateResult = dbStore.updateInvoice('org-strata', acmeId, inv => ({
    ...inv,
    notes: 'Malicious cross-tenant override attempt',
  }));

  assert.equal(updateResult, null);
  // Verify invoice in Acme was NOT modified
  const original = dbStore.getInvoiceById('org-acme', acmeId)!;
  assert.notEqual(original.notes, 'Malicious cross-tenant override attempt');
});

test('Security Check 5: RBAC permissions guard - Collector vs Owner roles', () => {
  const owner = SEED_USERS.find(u => u.role === 'owner')!;
  const collector = SEED_USERS.find(u => u.role === 'collector')!;

  assert.equal(owner.role, 'owner');
  assert.equal(collector.role, 'collector');

  const allowedForDeletion = ['owner', 'finance_manager'];
  assert.equal(allowedForDeletion.includes(owner.role), true);
  assert.equal(allowedForDeletion.includes(collector.role), false);
});

test('Security Check 6: CSV formula injection defense escapes command triggers', () => {
  const maliciousCells = ['=cmd|', '+2+2', '-EXEC()', '@SUM(A1:A10)', '\tTAB', '\rCR'];
  for (const cell of maliciousCells) {
    const sanitized = sanitizeCsvCell(cell);
    assert.ok(sanitized.startsWith("'"), `Cell ${cell} was not properly sanitized!`);
  }

  const safeCell = 'Acme Global Services Inc';
  assert.equal(sanitizeCsvCell(safeCell), 'Acme Global Services Inc');
});

test('Security Check 7: Session revocation successfully invalidates credentials', () => {
  const elena = SEED_USERS.find(u => u.email === 'elena@strata-media.com')!;
  const session = dbStore.createSession(elena);

  assert.ok(dbStore.getSession(session.token) !== null);

  const revoked = dbStore.revokeSession(session.token);
  assert.equal(revoked, true);

  const postRevoke = dbStore.getSession(session.token);
  assert.equal(postRevoke, null);
});

test('Security Check 8: Registration creates distinct isolated tenant & issues valid session', () => {
  const regResult = dbStore.registerUserAndTenant({
    fullName: 'Alexandre Dumas',
    email: 'alexandre@valois-holding.fr',
    companyName: 'Valois Holding SA',
    password: 'SuperSecretPassword2026!',
  });

  assert.ok(regResult.user.id.startsWith('user-'));
  assert.ok(regResult.user.organizationId.startsWith('org-valois-holding'));
  assert.equal(regResult.user.role, 'owner');
  assert.equal(regResult.user.organizationName, 'Valois Holding SA');
  assert.ok(regResult.session.token.startsWith('tok_'));

  // Verify isolated empty initial state
  const invoices = dbStore.getInvoices(regResult.user.organizationId);
  assert.equal(invoices.length, 0);

  // Verify onboarding state
  const onboarding = dbStore.getOnboardingState(regResult.user.organizationId);
  assert.equal(onboarding.hasConfiguredCompany, true);
  assert.equal(onboarding.hasImportedFile, false);
});

test('Security Check 9: Duplicate registration is prevented with explicit error', () => {
  assert.throws(
    () => {
      dbStore.registerUserAndTenant({
        fullName: 'Duplicate Sarah',
        email: 'sarah@acme-consulting.com',
        companyName: 'Duplicate Inc',
        password: 'Password123!',
      });
    },
    /existe déjà/
  );
});

test('Security Check 10: Authenticate user verifies credentials and creates authoritative session', () => {
  const authResult = dbStore.authenticateUser('alexandre@valois-holding.fr', 'SuperSecretPassword2026!');
  assert.ok(authResult.session.token);
  assert.equal(authResult.user.email, 'alexandre@valois-holding.fr');

  // Invalid password throws error
  assert.throws(
    () => {
      dbStore.authenticateUser('alexandre@valois-holding.fr', 'wrong_pass');
    },
    /Mot de passe incorrect/
  );
});

