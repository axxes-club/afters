#!/bin/sh
set -e

echo "🚀 Starting Afters Development Environment..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD=afters psql -h postgres -U afters -d afters -c "SELECT 1" > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "✅ PostgreSQL is up!"

# Run migrations
echo "📦 Running database migrations..."
pnpm prisma migrate deploy

# Check if we should seed the database (first run)
if [ ! -f /app/.docker-seeded ]; then
  echo "🌱 First run detected - seeding database..."
  pnpm prisma db seed || echo "⚠️  Seed failed or no seed configured"
  touch /app/.docker-seeded
  echo "✅ Database seeded!"
else
  echo "✅ Database already seeded (skip)"
fi

# Start the development server
echo "🌟 Starting Next.js development server..."
exec pnpm dev:lan