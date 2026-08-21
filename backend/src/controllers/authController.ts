import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_billing_manager_key';

export async function register(req: AuthenticatedRequest, res: Response) {
  const { name, email, password, companyName } = req.body;

  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ error: 'Name, email, password, and company name are required.' });
  }

  try {
    // Check if email already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    const orgId = uuidv4();
    const userId = uuidv4();
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    
    const passwordHash = await bcrypt.hash(password, 10);

    await db.transaction(async (trx) => {
      // 1. Create Organization
      await trx('organizations').insert({
        id: orgId,
        name: companyName,
        slug,
        subscription_status: 'none',
        subscription_plan: 'free',
        created_at: new Date(),
        updated_at: new Date()
      });

      // 2. Create User
      await trx('users').insert({
        id: userId,
        organization_id: orgId,
        name,
        email,
        password_hash: passwordHash,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    const token = jwt.sign(
      { id: userId, organizationId: orgId, email, name, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: { id: userId, name, email, role: 'admin' },
      organization: { 
        id: orgId, 
        name: companyName, 
        slug, 
        subscriptionPlan: 'free', 
        subscriptionStatus: 'none',
        logoUrl: null,
        address: null,
        taxId: null,
        phone: null,
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpFrom: null,
        smtpHasPassword: false
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An error occurred during tenant registration.' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const org = await db('organizations').where({ id: user.organization_id }).first();
    if (!org) {
      return res.status(500).json({ error: 'Organization data not found.' });
    }

    const token = jwt.sign(
      { id: user.id, organizationId: user.organization_id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscriptionPlan: org.subscription_plan,
        subscriptionStatus: org.subscription_status,
        logoUrl: org.logo_url,
        address: org.address,
        taxId: org.tax_id,
        phone: org.phone,
        smtpHost: org.smtp_host,
        smtpPort: org.smtp_port,
        smtpUser: org.smtp_user,
        smtpFrom: org.smtp_from,
        smtpHasPassword: !!org.smtp_pass
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An error occurred during authentication.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const org = await db('organizations').where({ id: user.organization_id }).first();
    if (!org) {
      return res.status(404).json({ error: 'Organization account not found.' });
    }

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscriptionPlan: org.subscription_plan,
        subscriptionStatus: org.subscription_status,
        logoUrl: org.logo_url,
        address: org.address,
        taxId: org.tax_id,
        phone: org.phone,
        smtpHost: org.smtp_host,
        smtpPort: org.smtp_port,
        smtpUser: org.smtp_user,
        smtpFrom: org.smtp_from,
        smtpHasPassword: !!org.smtp_pass
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'An error occurred loading profile.' });
  }
}
