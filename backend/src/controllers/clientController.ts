import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getClients(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const clients = await db('clients')
      .where({ organization_id: orgId })
      .orderBy('created_at', 'desc');
    return res.json(clients);
  } catch (err) {
    console.error('Fetch clients error:', err);
    return res.status(500).json({ error: 'Failed to retrieve clients.' });
  }
}

export async function getClient(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const client = await db('clients')
      .where({ id, organization_id: orgId })
      .first();
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    return res.json(client);
  } catch (err) {
    console.error('Fetch client error:', err);
    return res.status(500).json({ error: 'Failed to retrieve client details.' });
  }
}

export async function createClient(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const { name, email, companyName, taxId, address, phone } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({ error: 'Client name, email, and billing address are required.' });
  }

  try {
    const client = {
      id: uuidv4(),
      organization_id: orgId,
      name,
      email,
      company_name: companyName || null,
      tax_id: taxId || null,
      address,
      phone: phone || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('clients').insert(client);
    return res.status(201).json(client);
  } catch (err) {
    console.error('Create client error:', err);
    return res.status(500).json({ error: 'Failed to create client record.' });
  }
}

export async function updateClient(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const { name, email, companyName, taxId, address, phone } = req.body;

  try {
    const client = await db('clients').where({ id, organization_id: orgId }).first();
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const updated = {
      name: name || client.name,
      email: email || client.email,
      company_name: companyName !== undefined ? companyName : client.company_name,
      tax_id: taxId !== undefined ? taxId : client.tax_id,
      address: address || client.address,
      phone: phone !== undefined ? phone : client.phone,
      updated_at: new Date()
    };

    await db('clients').where({ id, organization_id: orgId }).update(updated);
    return res.json({ ...client, ...updated });
  } catch (err) {
    console.error('Update client error:', err);
    return res.status(500).json({ error: 'Failed to update client details.' });
  }
}

export async function deleteClient(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const client = await db('clients').where({ id, organization_id: orgId }).first();
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    await db('clients').where({ id, organization_id: orgId }).delete();
    return res.json({ message: 'Client successfully deleted.' });
  } catch (err) {
    console.error('Delete client error:', err);
    return res.status(500).json({ error: 'Failed to delete client record.' });
  }
}
