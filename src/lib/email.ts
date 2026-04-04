import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://3l4n.com'

export async function sendVerificationEmail(email: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Confirme ton adresse email — 3l4n',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:16px;">
        <h1 style="color:#10b981;font-size:28px;margin:0 0 8px">3l4n</h1>
        <p style="color:#aaa;margin:0 0 24px">Ton élan commence ici.</p>
        <p style="margin:0 0 24px">Clique sur le bouton ci-dessous pour confirmer ton adresse email :</p>
        <a href="${BASE_URL}/verify-email?token=${token}" style="display:inline-block;background:#10b981;color:#000;font-weight:bold;padding:12px 24px;border-radius:9999px;text-decoration:none;">
          Confirmer mon email
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px">Ce lien est valable 24h. Si tu n'as pas créé de compte sur 3l4n, ignore cet email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Réinitialise ton mot de passe — 3l4n',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#fff;padding:32px;border-radius:16px;">
        <h1 style="color:#10b981;font-size:28px;margin:0 0 8px">3l4n</h1>
        <p style="color:#aaa;margin:0 0 24px">Réinitialisation de mot de passe</p>
        <p style="margin:0 0 24px">Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <a href="${BASE_URL}/reset-password?token=${token}" style="display:inline-block;background:#10b981;color:#000;font-weight:bold;padding:12px 24px;border-radius:9999px;text-decoration:none;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px">Ce lien expire dans 1 heure. Si tu n'as pas demandé de réinitialisation, ignore cet email.</p>
      </div>
    `,
  })
}
