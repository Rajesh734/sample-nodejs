-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT,
ADD COLUMN "provider" TEXT,
ADD COLUMN "providerId" TEXT,
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_providerId_idx" ON "User"("providerId");
