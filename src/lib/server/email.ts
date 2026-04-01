import { BREVO_API_KEY, STORE_EMAIL, STORE_NAME } from '$env/static/private';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export async function sendEmail(to: string, toName: string, subject: string, html: string) {
	const res = await fetch(BREVO_URL, {
		method: 'POST',
		headers: {
			'api-key': BREVO_API_KEY,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			sender: { name: STORE_NAME, email: STORE_EMAIL },
			to: [{ email: to, name: toName }],
			subject,
			htmlContent: html
		})
	});

	if (!res.ok) {
		const errText = await res.text();
		console.error('Brevo sendEmail FAILED — status:', res.status, '— body:', errText);
		return false;
	}
	console.log('Brevo email sent OK to:', to);
	return true;
}

// ─── Templates ───────────────────────────────────────────────────────────────

function baseTemplate(content: string) {
	return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IM Sportswear</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:28px 40px;border-radius:10px 10px 0 0;text-align:center;">
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.08em;">IM SPORTSWEAR</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 10px 10px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              IM Sportswear · shop.imsportswear.cl<br/>
              Si tienes dudas responde este email o escríbenos a <a href="mailto:${STORE_EMAIL}" style="color:#111827;">${STORE_EMAIL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function clp(n: number) {
	return '$' + (n ?? 0).toLocaleString('es-CL');
}

function statusBadgeColor(status: string) {
	const colors: Record<string, { bg: string; text: string }> = {
		created:   { bg: '#e0f2fe', text: '#0369a1' },
		preparing: { bg: '#fef3c7', text: '#92400e' },
		shipped:   { bg: '#ede9fe', text: '#5b21b6' },
		delivered: { bg: '#dcfce7', text: '#166534' },
		cancelled: { bg: '#fee2e2', text: '#991b1b' },
	};
	return colors[status] ?? { bg: '#f1f5f9', text: '#475569' };
}

const STATUS_LABELS: Record<string, string> = {
	created: 'Orden creada',
	preparing: 'En preparación',
	shipped: 'Despachado',
	delivered: 'Entregado',
	cancelled: 'Cancelado',
};

const STATUS_MESSAGES: Record<string, string> = {
	created: 'Hemos recibido tu pedido y está siendo procesado.',
	preparing: 'Tu pedido está siendo preparado con cuidado para ser despachado pronto.',
	shipped: 'Tu pedido está en camino. ¡Pronto lo tendrás en tus manos!',
	delivered: '¡Tu pedido fue entregado! Esperamos que lo disfrutes.',
	cancelled: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
};

interface OrderEmailData {
	orderNumber: number;
	customerName: string;
	status: string;
	items: Array<{ product_name: string; color?: string; size?: string; quantity: number; total: number }>;
	subtotal: number;
	iva: number;
	shippingCost: number;
	total: number;
	trackingId?: string;
	shippingProvider?: string;
	shippingAddress?: string;
}

export function buildOrderEmail(data: OrderEmailData): { subject: string; html: string } {
	const badge = statusBadgeColor(data.status);
	const label = STATUS_LABELS[data.status] ?? data.status;
	const message = STATUS_MESSAGES[data.status] ?? '';

	const itemsRows = data.items.map(item => `
		<tr>
			<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;">
				<strong>${item.product_name}</strong>
				${item.color || item.size ? `<br/><span style="color:#9ca3af;font-size:12px;">${[item.color, item.size].filter(Boolean).join(' · ')}</span>` : ''}
			</td>
			<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:center;color:#6b7280;">×${item.quantity}</td>
			<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:right;font-weight:600;">${clp(item.total)}</td>
		</tr>
	`).join('');

	const trackingSection = data.trackingId ? `
		<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
			<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Número de seguimiento</p>
			<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.06em;">${data.trackingId}</p>
			<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;text-transform:uppercase;">${data.shippingProvider}</p>
		</div>
	` : '';

	const content = `
		<p style="margin:0 0 6px;font-size:14px;color:#6b7280;">Pedido #${data.orderNumber}</p>
		<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Hola, ${data.customerName}</h1>
		<div style="display:inline-block;background:${badge.bg};color:${badge.text};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">${label}</div>
		<p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">${message}</p>

		${trackingSection}

		<!-- Resumen del pedido -->
		<h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827;border-top:2px solid #111827;padding-top:16px;">Resumen del pedido</h3>
		<table width="100%" cellpadding="0" cellspacing="0">
			${itemsRows}
			<tr>
				<td colspan="2" style="padding:8px 0 4px;font-size:13px;color:#6b7280;">Subtotal</td>
				<td style="padding:8px 0 4px;font-size:13px;text-align:right;">${clp(data.subtotal)}</td>
			</tr>
			<tr>
				<td colspan="2" style="padding:2px 0;font-size:12px;color:#9ca3af;">IVA incluido (19%)</td>
				<td style="padding:2px 0;font-size:12px;color:#9ca3af;text-align:right;">${clp(data.iva)}</td>
			</tr>
			<tr>
				<td colspan="2" style="padding:2px 0 8px;font-size:13px;color:#6b7280;">Envío</td>
				<td style="padding:2px 0 8px;font-size:13px;text-align:right;">${clp(data.shippingCost)}</td>
			</tr>
			<tr style="border-top:2px solid #111827;">
				<td colspan="2" style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111827;">Total</td>
				<td style="padding:12px 0 0;font-size:16px;font-weight:700;text-align:right;color:#111827;">${clp(data.total)}</td>
			</tr>
		</table>

		<div style="margin-top:32px;text-align:center;">
			<a href="https://shop.imsportswear.cl" style="display:inline-block;background:#111827;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Ver tienda</a>
		</div>
	`;

	return {
		subject: `Pedido #${data.orderNumber} — ${label} | IM Sportswear`,
		html: baseTemplate(content)
	};
}
