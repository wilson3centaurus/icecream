import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

async function getEmailConfigBlob(
  service: ReturnType<typeof createServiceRoleClient>,
): Promise<EmailConfig> {
  const { data: record } = await service
    .schema('icecream_erp')
    .from('document_files')
    .select('file_url')
    .eq('reference_type', 'email_config')
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

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  if (!can(ctx, 'settings.write')) return forbidden();

  const service = createServiceRoleClient();

  try {
    const body = await request.json().catch(() => ({})) as { recipient?: string };
    const config = await getEmailConfigBlob(service);

    if (!config.fromEmail) {
      return NextResponse.json({ error: 'No sending email configured. Save your email settings first.' }, { status: 400 });
    }
    if (!config.appPassword) {
      return NextResponse.json({ error: 'No App Password configured. Save your email settings first.' }, { status: 400 });
    }

    const recipient = body.recipient?.trim() || config.fromEmail;

    const transporter = nodemailer.createTransport({
      host: config.smtpHost || 'smtp.gmail.com',
      port: config.smtpPort || 587,
      secure: (config.smtpPort || 587) === 465,
      auth: {
        user: config.fromEmail,
        pass: config.appPassword,
      },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipient,
      subject: 'Absolute Ice Cream ERP — Test Email',
      text: 'This is a test email from your Absolute Ice Cream ERP system. If you received this, your email configuration is working correctly.',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff7e8; border-radius: 16px;">
          <h2 style="color: #3B1F12; margin: 0 0 12px;">Test Email ✓</h2>
          <p style="color: #6B4A3A; margin: 0 0 8px;">Your <strong>Absolute Ice Cream ERP</strong> email configuration is working correctly.</p>
          <p style="color: #6B4A3A; font-size: 13px; margin: 0;">Sent from: ${config.fromEmail}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, recipient });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send test email';
    return serverError(message);
  }
}
