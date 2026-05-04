const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  USE_LOCAL_STORAGE: z.string().default('false'),
  LOCAL_UPLOAD_PATH: z.string().default('./uploads'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  WEB_ORIGINS: z.string().default(''),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌  Invalid environment variables:');
  _parsed.error.errors.forEach((e) => {
    console.error(`   ${e.path.join('.')}: ${e.message}`);
  });
  process.exit(1);
}

const env = _parsed.data;

env.USE_LOCAL_STORAGE = env.USE_LOCAL_STORAGE === 'true';

const s3Configured =
  env.S3_ENDPOINT &&
  env.S3_BUCKET &&
  env.S3_ACCESS_KEY_ID &&
  env.S3_SECRET_ACCESS_KEY;

env.USE_S3 = !env.USE_LOCAL_STORAGE && Boolean(s3Configured);

module.exports = env;
