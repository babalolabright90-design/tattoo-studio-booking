import { escapeHtml } from "@/lib/format"

export type EmailContext = {
  businessName: string
  siteUrl: string
  phone: string
  email: string
  address: string
}

export type Rendered = { subject: string; html: string; text: string }

type Row = [label: string, value: string]

function layout(ctx: EmailContext, opts: { preheader: string; title: string; intro: string; rows?: Row[]; button?: { label: string; href: string }; outro?: string }) {
  const rows = (opts.rows ?? [])
    .map(
      ([label, value]) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#9a9aa2;font-size:13px;width:38%;vertical-align:top">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#f4f4f5;font-size:14px;vertical-align:top">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("")

  const button = opts.button
    ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(opts.button.href)}" style="display:inline-block;background:#d6342b;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;font-size:14px;letter-spacing:.04em;text-transform:uppercase">${escapeHtml(opts.button.label)}</a></p>`
    : ""

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#0b0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#151518;border:1px solid #2a2a2e;border-radius:10px">
    <tr><td style="padding:28px 32px;border-bottom:2px solid #d6342b">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#f4f4f5;letter-spacing:.02em">${escapeHtml(ctx.businessName)}</span>
    </td></tr>
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;color:#f4f4f5">${escapeHtml(opts.title)}</h1>
      <p style="margin:0 0 22px;color:#c9c9cf;font-size:15px;line-height:1.6">${opts.intro}</p>
      ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>` : ""}
      ${button}
      ${opts.outro ? `<p style="margin:22px 0 0;color:#9a9aa2;font-size:13px;line-height:1.6">${opts.outro}</p>` : ""}
    </td></tr>
    <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2e;color:#7a7a82;font-size:12px;line-height:1.6">
      ${escapeHtml(ctx.businessName)} &middot; ${escapeHtml(ctx.address)}<br>
      ${escapeHtml(ctx.phone)} &middot; <a href="mailto:${escapeHtml(ctx.email)}" style="color:#9a9aa2">${escapeHtml(ctx.email)}</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`

  const text = [
    opts.title,
    "",
    opts.intro.replace(/<[^>]+>/g, ""),
    "",
    ...(opts.rows ?? []).map(([l, v]) => `${l}: ${v}`),
    opts.button ? `\n${opts.button.label}: ${opts.button.href}` : "",
    "",
    `${ctx.businessName} - ${ctx.phone}`,
  ].join("\n")

  return { html, text }
}

export type BookingEmailData = {
  reference: string
  customerName: string
  artistName: string
  style: string
  placement: string
  size: string
  when: string
  status?: string
  note?: string | null
  amount?: string
  paymentUrl?: string
}

function bookingRows(d: BookingEmailData): Row[] {
  return [
    ["Reference", d.reference],
    ["Artist", d.artistName],
    ["Date & time", d.when],
    ["Style", d.style],
    ["Placement", d.placement],
    ["Size", d.size],
  ]
}

const first = (name: string) => escapeHtml(name.split(" ")[0] ?? name)

export function bookingSubmitted(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "We received your tattoo request.",
    title: "Request received",
    intro: `Hi ${first(d.customerName)}, thanks for your request. Your artist will review your idea and reply within 1-2 business days. Nothing is confirmed until you receive a confirmation email.`,
    rows: bookingRows(d),
    outro: "Need to change something? Reply to this email or call us and quote your reference.",
  })
  return { subject: `We received your request (${d.reference})`, html, text }
}

export function bookingConfirmed(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "Your tattoo appointment is confirmed.",
    title: "Your appointment is confirmed",
    intro: `Hi ${first(d.customerName)}, great news - your session is confirmed. We cannot wait to bring your idea to life.`,
    rows: [...bookingRows(d), ...(d.note ? ([["Note from your artist", d.note]] as Row[]) : [])],
    outro:
      "Please arrive 10 minutes early with a valid photo ID, eat beforehand and wear clothing that gives easy access to the area being tattooed.",
  })
  return { subject: `Appointment confirmed (${d.reference})`, html, text }
}

export function bookingRejected(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "An update on your tattoo request.",
    title: "About your request",
    intro: `Hi ${first(d.customerName)}, thank you for thinking of us. Unfortunately we are not able to take this project on.${d.note ? "" : " You are welcome to submit a new request with a different date or idea."}`,
    rows: [...bookingRows(d), ...(d.note ? ([["Message", d.note]] as Row[]) : [])],
    button: { label: "Request another date", href: `${ctx.siteUrl}/booking` },
  })
  return { subject: `Update on your request (${d.reference})`, html, text }
}

export function bookingRescheduled(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "Your appointment time has changed.",
    title: "Your appointment was rescheduled",
    intro: `Hi ${first(d.customerName)}, your appointment has moved to a new time. Please reply to this email if the new time does not work for you.`,
    rows: bookingRows(d),
  })
  return { subject: `Appointment rescheduled (${d.reference})`, html, text }
}

export function depositRequested(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "Pay your deposit to secure your slot.",
    title: "Deposit required to secure your slot",
    intro: `Hi ${first(d.customerName)}, your request is approved. To lock in your appointment, please pay the deposit of <strong style="color:#f4f4f5">${escapeHtml(d.amount ?? "")}</strong>. It is deducted from the final price of your tattoo.`,
    rows: bookingRows(d),
    button: d.paymentUrl ? { label: "Pay deposit", href: d.paymentUrl } : undefined,
    outro: "Payments are processed securely by Stripe. We never see or store your card details.",
  })
  return { subject: `Deposit required (${d.reference})`, html, text }
}

export function depositReceived(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "We received your deposit.",
    title: "Deposit received",
    intro: `Hi ${first(d.customerName)}, thank you - your deposit of <strong style="color:#f4f4f5">${escapeHtml(d.amount ?? "")}</strong> has been received and your appointment is secured.`,
    rows: bookingRows(d),
  })
  return { subject: `Deposit received (${d.reference})`, html, text }
}

export function bookingCancelled(ctx: EmailContext, d: BookingEmailData): Rendered {
  const { html, text } = layout(ctx, {
    preheader: "Your appointment was cancelled.",
    title: "Your appointment was cancelled",
    intro: `Hi ${first(d.customerName)}, your appointment has been cancelled.${d.note ? "" : " If this is unexpected, please get in touch."}`,
    rows: [...bookingRows(d), ...(d.note ? ([["Note", d.note]] as Row[]) : [])],
    button: { label: "Book again", href: `${ctx.siteUrl}/booking` },
  })
  return { subject: `Appointment cancelled (${d.reference})`, html, text }
}

export function adminNewBooking(ctx: EmailContext, d: BookingEmailData & { customerEmail: string; customerPhone: string; description: string }): Rendered {
  const { html, text } = layout(ctx, {
    preheader: `New request from ${d.customerName}`,
    title: "New booking request",
    intro: `${escapeHtml(d.customerName)} just submitted a request. Review it in your dashboard.`,
    rows: [
      ...bookingRows(d),
      ["Customer", d.customerName],
      ["Email", d.customerEmail],
      ["Phone", d.customerPhone],
      ["Idea", d.description.slice(0, 400)],
    ],
    button: { label: "Open dashboard", href: `${ctx.siteUrl}/admin/bookings` },
  })
  return { subject: `New booking request - ${d.customerName}`, html, text }
}

export function contactMessage(ctx: EmailContext, d: { name: string; email: string; message: string }): Rendered {
  const { html, text } = layout(ctx, {
    preheader: `Message from ${d.name}`,
    title: "New website message",
    intro: "Someone sent a message through the contact form.",
    rows: [
      ["Name", d.name],
      ["Email", d.email],
      ["Message", d.message],
    ],
  })
  return { subject: `Website message from ${d.name}`, html, text }
}
