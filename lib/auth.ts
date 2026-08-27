import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

const origins = [
  ...(process.env.NODE_ENV === 'development'
    ? [
        'http://localhost:3000',
        ...(['V0_RUNTIME_URL', 'V0_DEV_APP_URL', 'V0_BUILD_URL', 'V0_SANDBOX_URL']
          .map((key) => process.env[key])
          .filter((value): value is string => Boolean(value))),
      ]
    : []),
  ...(process.env.NODE_ENV === 'production'
    ? [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : '',
      ].filter(Boolean)
    : []),
]

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: origins,
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } }
    : {}),
})
