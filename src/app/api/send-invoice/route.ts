import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend API client
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceNumber, clientName, clientEmail, total, dueDate, items } = body;

    if (!clientEmail) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    // Dispatch transaction email via Resend
    const data = await resend.emails.send({
      from: 'Billing Service <onboarding@resend.dev>',
      to: [clientEmail],
      subject: `Invoice ${invoiceNumber} from Your Business`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Invoice ${invoiceNumber}</h2>
          <p>Hi <strong>${clientName}</strong>,</p>
          <p>Thank you for your business. Here is a summary of your invoice due on <strong>${dueDate}</strong>:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <ul style="list-style-type: none; padding: 0;">
              ${items
                .map(
                  (item: any) =>
                    `<li style="padding: 5px 0;"><strong>${item.description}</strong> — ${item.quantity} x$${item.unitPrice.toFixed(2)}</li>`
                )
                .join('')}
            </ul>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;" />
            <h3 style="margin: 0; text-align: right; color: #1e293b;">Total Due: $${total.toFixed(2)}</h3>
          </div>

          <p>If you have any questions, feel free to reply directly to this email.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Sent via GG Billing Hub</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}