-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "ContributionType" AS ENUM ('GAVE', 'RECEIVED');
CREATE TYPE "ContributionMode" AS ENUM ('CASH', 'GOLD', 'SILVER', 'ITEM');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateTable Person
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "fatherName" TEXT,
    "phone" TEXT,
    "homeTown" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    
    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Person_deletedAt_idx" ON "Person"("deletedAt");

-- CreateTable Event
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "hostPersonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Event_hostPersonId_idx" ON "Event"("hostPersonId");
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateTable Contribution
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fromPersonId" TEXT NOT NULL,
    "toPersonId" TEXT NOT NULL,
    "type" "ContributionType" NOT NULL,
    "mode" "ContributionMode" NOT NULL,
    "amount" DECIMAL(10,2),
    "currencyCode" TEXT,
    "itemType" TEXT,
    "itemQuantity" INTEGER,
    "notes" TEXT,
    "contributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    
    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Contribution_eventId_idx" ON "Contribution"("eventId");
CREATE INDEX "Contribution_fromPersonId_idx" ON "Contribution"("fromPersonId");
CREATE INDEX "Contribution_toPersonId_idx" ON "Contribution"("toPersonId");
CREATE INDEX "Contribution_deletedAt_idx" ON "Contribution"("deletedAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_hostPersonId_fkey" FOREIGN KEY ("hostPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_fromPersonId_fkey" FOREIGN KEY ("fromPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_toPersonId_fkey" FOREIGN KEY ("toPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
