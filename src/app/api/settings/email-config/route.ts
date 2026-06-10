import { NextRequest, NextResponse } from 'next/server';

import { can, forbidden, getAuthContext, serverError, unauthorized } from '@/lib/api-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  smtpHost: string;
  smtpPort: number;
  appPassword: string;
}

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  fromEmail: '',
  fromName: 'Absolute Ice Cream ERP',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  appPassword: '',
};

const REFERENCE_TYPE = 'email_config';

async function getEmailConfigBlob(
  service: ReturnType<typeof createServiceRoleClient>,
): Promise<EmailConfig> {
  const { data: record } = await service
    .schema('icecream_erp')
    .from('document_files')
    .select('file_url')
    .eq('reference_type', REFERENCE_TYPE)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record?.file_url?.startsWith('json://')) return DEFAULT_EMAIL_CONFIG;
  try {
    const parsed = JSON.parse(decodeURIComponent(record.file_url.replace('json://', ''))) as EmailConfig;
    return { ...DEFAULT_EMAIL_CONFIG, ...parsed };
  } catch {
    return DEFAULT_EMAIL_CONFIG;
  }
}

export async function GET(_request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  if (!can(ctx, 'settings.read')) return forbidden();

  const service = createServiceRoleClient();

  try {
    const config = await getEmailConfigBlob(service);
    return NextResponse.json({
      ...config,
      appPassword: config.appPassword ? '••••••••' : '',
    });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : 'Internal server error');
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  if (!can(ctx, 'settings.write')) return forbidden();

  const service = createServiceRoleClient();

  try {
    const body = await request.json() as Partial<EmailConfig>;

    const current = await getEmailConfigBlob(service);

    const updated: EmailConfig = {
      fromEmail: body.fromEmail ?? current.fromEmail,
      fromName: body.fromName ?? current.fromName,
      smtpHost: body.smtpHost ?? current.smtpHost,
      smtpPort: body.smtpPort ?? current.smtpPort,
      appPassword: body.appPassword && body.appPassword !== '••••••••'
        ? body.appPassword
        : current.appPassword,
    };

    const content = JSON.stringify(updated);
    const fileUrl = `json://${encodeURIComponent(content)}`;

    const { data: existing } = await service
      .schema('icecream_erp')
      .from('document_files')
      .select('id')
      .eq('reference_type', REFERENCE_TYPE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      await service.schema('icecream_erp').from('document_files').update({
        file_url: fileUrl,
        file_size: Buffer.byteLength(content, 'utf8'),
        file_type: 'application/json',
        uploaded_by: ctx.userId,
      }).eq('id', existing.id);
    } else {
      await service.schema('icecream_erp').from('document_files').insert({
        file_name: 'email_config.json',
        file_url: fileUrl,
        file_size: Buffer.byteLength(content, 'utf8'),
        file_type: 'application/json',
        reference_type: REFERENCE_TYPE,
        uploaded_by: ctx.userId,
      });
    }

    return NextResponse.json({
      ...updated,
      appPassword: updated.appPassword ? '••••••••' : '',
    });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : 'Internal server error');
  }
}
