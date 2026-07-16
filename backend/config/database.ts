import path from 'path';
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'postgres') as 'postgres' | 'sqlite';

  const connections = {
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'ep-lively-fire-aoh9nkpx.c-2.ap-southeast-1.aws.neon.tech'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'neondb'),
        user: env('DATABASE_USERNAME', 'neondb_owner'),
        password: env('DATABASE_PASSWORD', 'npg_XH3xNY9uecJA'),
        ssl: {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: 2, max: 10 },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  if (!(client in connections)) {
    throw new Error(
      `Unsupported DATABASE_CLIENT: ${client}. Use "postgres" or "sqlite".`
    );
  }

  type DatabaseClient = keyof typeof connections;

  return {
    connection: {
      client: client as DatabaseClient,
      ...connections[client as DatabaseClient],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  } as Core.Config.Database;
};

export default config;