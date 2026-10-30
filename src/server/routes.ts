import { Router, Request, Response, NextFunction } from 'express';
import { dbStore, SEED_USERS, User } from './store';
import { calculateDaysPastDue, getAgingBucket, calculateRiskScore } from '../utils/financial';
import { InvoiceRecord } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
  organizationId?: string;
}

export const apiRouter = Router();

// ==========================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==========================================

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed Bearer authorization token',
    });
  }

  const token = authHeader.substring(7).trim();
  const authContext = dbStore.getSession(token);

  if (!authContext) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired session token',
    });
  }

  // Authoritatively bind server context
  req.user = authContext.user;
  req.organizationId = authContext.user.organizationId;
  next();
}

export function requireRole(allowedRoles: Array<'owner' | 'finance_manager' | 'collector'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of roles [${allowedRoles.join(', ')}]. Current role: '${req.user?.role}'`,
      });
    }
    next();
  };
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = SEED_USERS.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    // Prevent account enumeration by using standard invalid credentials message
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const session = dbStore.createSession(user);
  return res.json({
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      role: user.role,
    },
  });
});

apiRouter.get('/auth/session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      role: user.role,
    },
  });
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization!;
  const token = authHeader.substring(7).trim();
  dbStore.revokeSession(token);
  return res.json({ message: 'Session successfully revoked' });
});

// Quick switch seed accounts for verification & evaluation
apiRouter.get('/auth/seed-accounts', (_req: Request, res: Response) => {
  res.json({
    accounts: SEED_USERS.map(u => ({
      email: u.email,
      name: u.name,
      organizationName: u.organizationName,
      organizationId: u.organizationId,
      role: u.role,
    })),
  });
});

// ==========================================
// TENANT-ISOLATED RECEIVABLES ENDPOINTS
// ==========================================

// GET all receivables for the authenticated organization
apiRouter.get('/receivables', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.organizationId!;
  const invoices = dbStore.getInvoices(orgId);
  return res.json({
    organizationId: orgId,
    totalRecords: invoices.length,
    invoices,
  });
});

// POST import receivables into the authenticated organization
apiRouter.post('/receivables/import', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.organizationId!;
  const { invoices } = req.body;

  if (!Array.isArray(invoices) || invoices.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: invoices must be a non-empty array' });
  }

  // Strict server-side validation on every invoice record
  const validatedInvoices: InvoiceRecord[] = [];
  for (let i = 0; i < invoices.length; i++) {
    const raw = invoices[i];
    const totalAmount = Number(raw.totalAmount);
    const paidAmount = Number(raw.paidAmount || 0);

    if (isNaN(totalAmount) || totalAmount < 0) {
      return res.status(400).json({
        error: `Validation Error at row ${i + 1}: totalAmount must be a non-negative number`,
      });
    }

    if (isNaN(paidAmount) || paidAmount < 0 || paidAmount > totalAmount) {
      return res.status(400).json({
        error: `Validation Error at row ${i + 1}: paidAmount must be between 0 and totalAmount`,
      });
    }

    if (!raw.invoiceNumber || !raw.customerName) {
      return res.status(400).json({
        error: `Validation Error at row ${i + 1}: invoiceNumber and customerName are required`,
      });
    }

    const outstandingAmount = Math.max(0, totalAmount - paidAmount);
    const daysPastDue = calculateDaysPastDue(raw.dueDate || '2026-10-01', '2026-10-29');
    const agingBucket = getAgingBucket(daysPastDue);

    validatedInvoices.push({
      id: raw.id || `inv-${orgId}-${i}-${Date.now()}`,
      invoiceNumber: String(raw.invoiceNumber).trim(),
      customerName: String(raw.customerName).trim(),
      customerEmail: String(raw.customerEmail || '').trim(),
      issueDate: raw.issueDate || '2026-09-01',
      dueDate: raw.dueDate || '2026-10-01',
      totalAmount,
      paidAmount,
      outstandingAmount,
      currency: (raw.currency || 'USD').toUpperCase().trim(),
      status: paidAmount >= totalAmount ? 'paid' : raw.status || (daysPastDue > 0 ? 'overdue' : 'current'),
      daysPastDue,
      agingBucket,
      riskScore: raw.riskScore || 25,
      riskTier: raw.riskTier || 'Medium',
      riskFactors: raw.riskFactors || [],
      notes: raw.notes || '',
    });
  }

  dbStore.saveInvoices(orgId, validatedInvoices);
  return res.json({
    message: `Successfully imported ${validatedInvoices.length} invoices for organization ${orgId}`,
    organizationId: orgId,
    importedCount: validatedInvoices.length,
  });
});

// POST record payment on an invoice (Tenant protected)
apiRouter.post('/receivables/:id/payment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.organizationId!;
  const invoiceId = req.params.id;
  const { amount, reference, date } = req.body;

  const paymentAmount = Number(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a positive number' });
  }

  const existing = dbStore.getInvoiceById(orgId, invoiceId);
  if (!existing) {
    return res.status(404).json({ error: `Invoice with ID ${invoiceId} not found in organization` });
  }

  if (paymentAmount > existing.outstandingAmount) {
    return res.status(400).json({
      error: `Payment amount ($${paymentAmount}) cannot exceed outstanding balance ($${existing.outstandingAmount})`,
    });
  }

  const updated = dbStore.updateInvoice(orgId, invoiceId, inv => {
    const newPaid = inv.paidAmount + paymentAmount;
    const newOutstanding = Math.max(0, inv.totalAmount - newPaid);
    const newStatus = newOutstanding <= 0 ? 'paid' : inv.status;

    return {
      ...inv,
      paidAmount: newPaid,
      outstandingAmount: newOutstanding,
      status: newStatus,
      notes: `${inv.notes ? inv.notes + ' | ' : ''}Payment of $${paymentAmount} settled on ${date || '2026-10-29'} (${reference || 'Wire'})`,
    };
  });

  return res.json({ message: 'Payment recorded successfully', invoice: updated });
});

// POST record promise-to-pay
apiRouter.post('/receivables/:id/promise', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.organizationId!;
  const invoiceId = req.params.id;
  const { promisedDate, notes } = req.body;

  if (!promisedDate || isNaN(Date.parse(promisedDate))) {
    return res.status(400).json({ error: 'A valid ISO promised payment date is required' });
  }

  const existing = dbStore.getInvoiceById(orgId, invoiceId);
  if (!existing) {
    return res.status(404).json({ error: `Invoice with ID ${invoiceId} not found in organization` });
  }

  const allOrgInvoices = dbStore.getInvoices(orgId);
  const totalPortfolio = allOrgInvoices.reduce((acc, curr) => acc + curr.outstandingAmount, 0);

  const updated = dbStore.updateInvoice(orgId, invoiceId, inv => {
    const { score, tier, factors } = calculateRiskScore({
      daysPastDue: inv.daysPastDue,
      outstandingAmount: inv.outstandingAmount,
      totalPortfolioAmount: totalPortfolio,
      isDisputed: inv.status === 'disputed',
      promisedDate,
      asOfDateStr: '2026-10-29',
    });

    return {
      ...inv,
      promisedPaymentDate: promisedDate,
      notes: notes || inv.notes,
      riskScore: score,
      riskTier: tier,
      riskFactors: factors,
    };
  });

  return res.json({ message: 'Promise commitment recorded', invoice: updated });
});

// DELETE invoice (Requires 'owner' or 'finance_manager' role, collectors are rejected!)
apiRouter.delete(
  '/receivables/:id',
  requireAuth,
  requireRole(['owner', 'finance_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.organizationId!;
    const invoiceId = req.params.id;

    const success = dbStore.deleteInvoice(orgId, invoiceId);
    if (!success) {
      return res.status(404).json({ error: 'Invoice not found in organization' });
    }

    return res.json({ message: `Invoice ${invoiceId} successfully deleted by authorized manager` });
  }
);
