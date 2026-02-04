-- Add Priority 1 AIS fields to vessel_positions table
-- Navigation dynamics (AIS Message Type 1/2/3)
ALTER TABLE "vessel_positions" ADD COLUMN "rateOfTurn" DOUBLE PRECISION;
ALTER TABLE "vessel_positions" ADD COLUMN "navigationStatus" INTEGER;
ALTER TABLE "vessel_positions" ADD COLUMN "positionAccuracy" BOOLEAN;
ALTER TABLE "vessel_positions" ADD COLUMN "maneuverIndicator" INTEGER;
ALTER TABLE "vessel_positions" ADD COLUMN "raimFlag" BOOLEAN;
ALTER TABLE "vessel_positions" ADD COLUMN "timestampSeconds" INTEGER;

-- Vessel characteristics (AIS Message Type 5)
ALTER TABLE "vessel_positions" ADD COLUMN "draught" DOUBLE PRECISION;
ALTER TABLE "vessel_positions" ADD COLUMN "dimensionToBow" INTEGER;
ALTER TABLE "vessel_positions" ADD COLUMN "dimensionToStern" INTEGER;
ALTER TABLE "vessel_positions" ADD COLUMN "dimensionToPort" INTEGER;
ALTER TABLE "vessel_positions" ADD COLUMN "dimensionToStarboard" INTEGER;

-- Add indexes for performance
CREATE INDEX "vessel_positions_navigationStatus_idx" ON "vessel_positions"("navigationStatus");
CREATE INDEX "vessel_positions_draught_idx" ON "vessel_positions"("draught");

-- Add comments for documentation
COMMENT ON COLUMN "vessel_positions"."rateOfTurn" IS 'Rate of turn in degrees per minute (-720 to +720, -128 = not available)';
COMMENT ON COLUMN "vessel_positions"."navigationStatus" IS 'AIS navigation status (0=underway engine, 1=at anchor, 5=moored, 8=underway sailing, 15=undefined)';
COMMENT ON COLUMN "vessel_positions"."positionAccuracy" IS 'Position accuracy: true = DGPS (<10m), false = unaugmented GNSS (>10m)';
COMMENT ON COLUMN "vessel_positions"."draught" IS 'Current draught in meters (0.1m resolution, 25.5 = not available)';
COMMENT ON COLUMN "vessel_positions"."dimensionToBow" IS 'Distance from AIS transponder to bow in meters';
COMMENT ON COLUMN "vessel_positions"."dimensionToStern" IS 'Distance from AIS transponder to stern in meters';
COMMENT ON COLUMN "vessel_positions"."dimensionToPort" IS 'Distance from AIS transponder to port side in meters';
COMMENT ON COLUMN "vessel_positions"."dimensionToStarboard" IS 'Distance from AIS transponder to starboard in meters';
