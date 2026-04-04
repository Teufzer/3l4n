ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "weightPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "expiresAt" TEXT; -- Pour emailVerification si pas déjà là
