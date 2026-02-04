-- CreateTable for VesselPosition with automatic 7-day cleanup
CREATE TABLE IF NOT EXISTS "vessel_positions" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "mmsi" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "course" DOUBLE PRECISION,
    "heading" INTEGER,
    "navStatus" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vessel_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vessel_positions_vesselId_idx" ON "vessel_positions"("vesselId");
CREATE INDEX "vessel_positions_mmsi_idx" ON "vessel_positions"("mmsi");
CREATE INDEX "vessel_positions_timestamp_idx" ON "vessel_positions"("timestamp");
CREATE INDEX "vessel_positions_createdAt_idx" ON "vessel_positions"("createdAt");

-- AddForeignKey
ALTER TABLE "vessel_positions" ADD CONSTRAINT "vessel_positions_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment
COMMENT ON TABLE "vessel_positions" IS 'AIS position reports - auto-deleted after 7 days';
