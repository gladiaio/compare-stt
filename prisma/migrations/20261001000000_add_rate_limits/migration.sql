-- CreateTable (shared fixed-window rate limit counters, one row per key)
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex (for cleanup of stale windows)
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");
