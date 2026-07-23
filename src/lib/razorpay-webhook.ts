import crypto from 'node:crypto'

export function verifyRazorpaySignature(
  rawBody: string,
  headerSignature: string,
  secret: string,
): boolean {
  if (!secret) return false
  if (!headerSignature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (expected.length !== headerSignature.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(headerSignature, 'hex'),
    )
  } catch {
    return false
  }
}
