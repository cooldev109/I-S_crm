-- CreateTable
CREATE TABLE "PendingIntake" (
    "id" TEXT NOT NULL,
    "waNumber" TEXT NOT NULL,
    "parsed" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingIntake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingIntake_waNumber_key" ON "PendingIntake"("waNumber");
