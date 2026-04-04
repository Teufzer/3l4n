#!/bin/sh
echo "Running Prisma DB push..."
npx prisma db push --accept-data-loss || echo "Warning: prisma db push failed, continuing..."
echo "Starting Next.js..."
exec npm start
