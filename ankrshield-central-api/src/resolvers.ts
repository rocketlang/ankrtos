import { pool, queryOne, queryMany, execute } from './db.js';
import { ThreatReportSchema } from './types.js';
import type { FastifyRequest } from 'fastify';

interface Context {
  request: FastifyRequest;
}

export const resolvers = {
  Query: {
    // Get latest active definition
    async latestDefinition() {
      return await queryOne(`
        SELECT * FROM daily_definitions
        WHERE status = 'active'
        ORDER BY release_date DESC, version DESC
        LIMIT 1
      `);
    },

    // Get specific definition
    async definition(_: any, { version }: { version: string }) {
      return await queryOne(`
        SELECT * FROM daily_definitions
        WHERE version = $1
      `, [version]);
    },

    // Get central statistics
    async stats() {
      const [installStats, reportStats, threatStats, latestDef] = await Promise.all([
        queryOne<any>(`
          SELECT
            COUNT(*) as total_installations,
            COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '24 hours') as active_24h,
            COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '7 days') as active_7d,
            COUNT(*) FILTER (WHERE opt_in_telemetry = true) as opt_in_count
          FROM field_installations
        `),
        queryOne<any>(`
          SELECT
            COUNT(*) as total_reports,
            COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as reports_today
          FROM threat_reports
        `),
        queryOne<any>(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending') as pending_threats,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_threats
          FROM aggregated_threats
        `),
        queryOne<any>(`
          SELECT version FROM daily_definitions
          WHERE status = 'active'
          ORDER BY release_date DESC
          LIMIT 1
        `)
      ]);

      return {
        total_installations: parseInt(installStats?.total_installations || '0'),
        active_24h: parseInt(installStats?.active_24h || '0'),
        active_7d: parseInt(installStats?.active_7d || '0'),
        opt_in_count: parseInt(installStats?.opt_in_count || '0'),
        total_reports: parseInt(reportStats?.total_reports || '0'),
        reports_today: parseInt(reportStats?.reports_today || '0'),
        pending_threats: parseInt(threatStats?.pending_threats || '0'),
        approved_threats: parseInt(threatStats?.approved_threats || '0'),
        latest_definition_version: latestDef?.version || null,
      };
    },

    // Get pending threats (admin)
    async pendingThreats(_: any, { limit = 50, offset = 0 }: { limit: number; offset: number }) {
      return await queryMany(`
        SELECT * FROM pending_threats_view
        ORDER BY priority_score DESC, report_count DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
    },

    // Get approved threats
    async approvedThreats(_: any, { limit = 100, offset = 0 }: { limit: number; offset: number }) {
      return await queryMany(`
        SELECT * FROM aggregated_threats
        WHERE status = 'approved'
        ORDER BY updated_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
    },

    // Get threat by domain
    async threat(_: any, { domain }: { domain: string }) {
      return await queryOne(`
        SELECT * FROM aggregated_threats
        WHERE domain = $1
      `, [domain]);
    },

    // Get recent reports (admin)
    async recentReports(_: any, { limit = 100, offset = 0 }: { limit: number; offset: number }) {
      return await queryMany(`
        SELECT
          id,
          report_id,
          domain,
          behavioral_signature::text as behavioral_signature,
          confidence,
          client_version,
          platform,
          installation_id,
          timestamp,
          processed
        FROM threat_reports
        ORDER BY timestamp DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
    },

    // Get active installations (admin)
    async activeInstallations(_: any, { limit = 100, offset = 0 }: { limit: number; offset: number }) {
      return await queryMany(`
        SELECT * FROM field_installations
        WHERE last_seen > NOW() - INTERVAL '30 days'
        ORDER BY last_seen DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
    },

    // Get installation by ID
    async installation(_: any, { installation_id }: { installation_id: string }) {
      return await queryOne(`
        SELECT * FROM field_installations
        WHERE installation_id = $1
      `, [installation_id]);
    },
  },

  Mutation: {
    // Submit threat report
    async submitReport(_: any, { input }: { input: any }, ctx: Context) {
      try {
        // Convert platform to lowercase for validation
        const normalizedInput = {
          ...input,
          platform: input.platform?.toLowerCase(),
        };

        // Validate input
        const validated = ThreatReportSchema.parse(normalizedInput);

        // Check for duplicate report_id
        const existing = await queryOne(`
          SELECT id FROM threat_reports WHERE report_id = $1
        `, [validated.report_id]);

        if (existing) {
          return {
            success: false,
            message: 'Duplicate report (already submitted)',
            report_id: validated.report_id,
          };
        }

        // Insert report
        const result = await queryOne<{ id: string }>(`
          INSERT INTO threat_reports (
            report_id, domain, behavioral_signature, confidence,
            client_version, platform, installation_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          validated.report_id,
          validated.domain,
          JSON.stringify(validated.behavioral_signature),
          validated.confidence,
          validated.client_version,
          validated.platform,
          validated.installation_id,
        ]);

        ctx.request.log.info({
          report_id: validated.report_id,
          domain: validated.domain,
          installation_id: validated.installation_id,
        }, 'Threat report submitted');

        return {
          success: true,
          message: 'Report submitted successfully',
          report_id: validated.report_id,
        };
      } catch (error: any) {
        ctx.request.log.error(error, 'Failed to submit report');
        return {
          success: false,
          message: error.message || 'Failed to submit report',
          report_id: null,
        };
      }
    },

    // Review threat (admin)
    async reviewThreat(_: any, { input }: { input: any }, ctx: Context) {
      try {
        const { domain, status, category, notes } = input;

        // Update aggregated threat
        const updated = await queryOne(`
          UPDATE aggregated_threats
          SET
            status = $2,
            category = $3,
            notes = $4,
            reviewed_at = NOW()
          WHERE domain = $1
          RETURNING *
        `, [domain, status.toLowerCase(), category, notes || null]);

        if (!updated) {
          return {
            success: false,
            message: `Threat not found: ${domain}`,
            threat: null,
          };
        }

        ctx.request.log.info({ domain, status, category }, 'Threat reviewed');

        return {
          success: true,
          message: 'Threat reviewed successfully',
          threat: updated,
        };
      } catch (error: any) {
        ctx.request.log.error(error, 'Failed to review threat');
        return {
          success: false,
          message: error.message || 'Failed to review threat',
          threat: null,
        };
      }
    },

    // Increment definition download count
    async incrementDownloadCount(_: any, { version }: { version: string }) {
      const updated = await execute(`
        UPDATE daily_definitions
        SET download_count = download_count + 1
        WHERE version = $1
      `, [version]);

      return updated > 0;
    },

    // Register or update installation
    async registerInstallation(_: any, args: any, ctx: Context) {
      const { installation_id, platform, version, opt_in_telemetry } = args;

      const result = await queryOne(`
        INSERT INTO field_installations (
          installation_id, platform, version, opt_in_telemetry, last_seen
        ) VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (installation_id)
        DO UPDATE SET
          platform = EXCLUDED.platform,
          version = EXCLUDED.version,
          opt_in_telemetry = EXCLUDED.opt_in_telemetry,
          last_seen = NOW()
        RETURNING *
      `, [installation_id, platform.toLowerCase(), version, opt_in_telemetry]);

      ctx.request.log.info({ installation_id, platform }, 'Installation registered');

      return result;
    },
  },
};
