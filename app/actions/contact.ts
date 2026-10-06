"use server"

import { contactSchema } from "@/lib/validation"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { sendContactMessage } from "@/lib/email/send"

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> }

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const ip = await clientIp()
  if (!(await rateLimit(`contact:${ip}`, 5, 60 * 60))) {
    return { error: "Too many messages. Please try again later." }
  }
  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    message: formData.get("message") ?? "",
    website: formData.get("website") ?? "",
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { error: "Please fix the highlighted fields.", fieldErrors }
  }
  if (parsed.data.website) return { ok: true }
  try {
    await sendContactMessage(parsed.data)
    return { ok: true }
  } catch (e) {
    console.error("contact failed", e)
    return { error: "We could not send your message. Please call or email us directly." }
  }
}
