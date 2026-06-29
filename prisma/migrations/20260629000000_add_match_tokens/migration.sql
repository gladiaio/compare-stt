-- CreateTable
CREATE TABLE "match_tokens" (
    "token_hash" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "provider_a_id" TEXT NOT NULL,
    "provider_b_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "match_tokens_pkey" PRIMARY KEY ("token_hash")
);

-- CreateIndex (for session vote cap queries)
CREATE INDEX "match_tokens_session_id_idx" ON "match_tokens"("session_id");
