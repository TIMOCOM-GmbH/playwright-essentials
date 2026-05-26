import { generate, HashAlgorithm } from 'otplib'

export async function generateOTP(
  sharedSecret: string,
  algorithm: HashAlgorithm = 'sha1',
  digits: number = 6,
  period: number = 30
): Promise<string> {
  const secret = sharedSecret.replace(/\s+/g, '').toUpperCase()
  const totp = await generate({
    secret,
    algorithm,
    digits,
    period,
  })
  return totp
}
