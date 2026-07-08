-- CreateTable: PageVisit for visitor analytics
CREATE TABLE "PageVisit" (
    "id"        TEXT         NOT NULL,
    "ipHash"    TEXT         NOT NULL,
    "country"   TEXT,
    "state"     TEXT,
    "city"      TEXT,
    "path"      TEXT         NOT NULL,
    "userAgent" TEXT,
    "referrer"  TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageVisit_visitedAt_idx" ON "PageVisit"("visitedAt");
CREATE INDEX "PageVisit_state_idx"     ON "PageVisit"("state");
