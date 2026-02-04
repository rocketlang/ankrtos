/**
 * Claim Letter Generator
 *
 * Pure business-logic module for generating formal maritime claim letters,
 * demurrage claim letters with laytime calculations, and response letters.
 * Produces structured text output suitable for PDF rendering or email dispatch.
 */

export interface ClaimData {
  claimRef: string
  claimType:
    | 'cargo_damage'
    | 'demurrage'
    | 'deviation'
    | 'dead_freight'
    | 'speed_reduction'
  claimant: { name: string; address: string }
  respondent: { name: string; address: string }
  vesselName: string
  voyageRef: string
  loadPort: string
  dischargePort: string
  amount: number
  currency: string
  description: string
  supportingDocs: string[]
  dateOfIncident: string
}

const CLAIM_TYPE_LABELS: Record<ClaimData['claimType'], string> = {
  cargo_damage: 'Cargo Damage',
  demurrage: 'Demurrage',
  deviation: 'Deviation',
  dead_freight: 'Dead Freight',
  speed_reduction: 'Speed Reduction'
}

function getApplicableLaw(claimType: ClaimData['claimType']): string {
  switch (claimType) {
    case 'cargo_damage':
      return 'The Hague-Visby Rules as incorporated into the applicable Bill of Lading terms'
    case 'demurrage':
      return 'The terms and conditions of the governing Charter Party'
    case 'deviation':
      return 'The terms of the Charter Party and/or Bill of Lading, and the common law duty to proceed without unjustified deviation'
    case 'dead_freight':
      return 'The Charter Party terms governing cargo quantity obligations'
    case 'speed_reduction':
      return 'The Charter Party warranty clauses regarding vessel speed and performance'
  }
}

function getJurisdiction(claimType: ClaimData['claimType']): string {
  switch (claimType) {
    case 'cargo_damage':
      return 'London Arbitration in accordance with the London Maritime Arbitrators Association (LMAA) terms, or as otherwise specified in the governing contract'
    case 'demurrage':
    case 'dead_freight':
      return 'Arbitration in London under LMAA terms as stipulated in the Charter Party'
    case 'deviation':
    case 'speed_reduction':
      return 'London Arbitration under LMAA terms, English law to apply'
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    return dateStr
  }
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calculateTimeBarDate(dateOfIncident: string): string {
  const d = new Date(dateOfIncident)
  if (isNaN(d.getTime())) {
    return '12 months from the date of incident'
  }
  d.setFullYear(d.getFullYear() + 1)
  return formatDate(d.toISOString())
}

/**
 * Generate a formal maritime claim letter from structured claim data.
 *
 * The letter includes:
 * - Formal subject line with claim reference and vessel name
 * - Incident description and liability assertion
 * - Quantum (amount claimed) paragraph
 * - List of supporting documents
 * - Time-bar warning (12 months from the date of incident)
 * - Formal closing
 *
 * @param data - The claim data used to populate the letter
 * @returns Object containing subject, body text, and legal notice
 */
export function generateClaimLetter(data: ClaimData): {
  subject: string
  body: string
  legalNotice: string
} {
  const claimTypeLabel = CLAIM_TYPE_LABELS[data.claimType]
  const formattedAmount = formatCurrency(data.amount, data.currency)
  const incidentDate = formatDate(data.dateOfIncident)
  const timeBarDate = calculateTimeBarDate(data.dateOfIncident)

  const subject = `${claimTypeLabel} Claim – Ref: ${data.claimRef} – MV "${data.vesselName}"`

  const supportingDocsList = data.supportingDocs.length > 0
    ? data.supportingDocs.map((doc, i) => `  ${i + 1}. ${doc}`).join('\n')
    : '  (To be provided under separate cover)'

  const body = `${data.claimant.name}
${data.claimant.address}

Date: ${formatDate(new Date().toISOString())}

To:
${data.respondent.name}
${data.respondent.address}

Re: ${subject}

Dear Sirs,

We write on behalf of ${data.claimant.name} in connection with the above-referenced matter.

INCIDENT

We refer to the voyage of MV "${data.vesselName}" (Voyage Ref: ${data.voyageRef}) from ${data.loadPort} to ${data.dischargePort}. On or about ${incidentDate}, the following incident occurred:

${data.description}

LIABILITY

On the basis of the facts set out above, we hold you fully responsible and liable for all losses and damages arising from this incident. Your liability arises under ${getApplicableLaw(data.claimType)}.

QUANTUM

The total amount claimed is ${formattedAmount}, representing the full extent of loss and damage suffered by our principals as a result of the aforementioned incident. A detailed breakdown of the claimed amount will be provided upon request.

SUPPORTING DOCUMENTS

The following documents are relied upon in support of this claim:
${supportingDocsList}

We reserve the right to submit additional evidence and documentation as may become available.

TIME BAR NOTICE

Please note that this claim is subject to a limitation period. The time bar for this claim expires on ${timeBarDate} (12 months from the date of incident). This letter constitutes a formal protective notification to preserve our clients' rights within the applicable limitation period.

We hereby request that you acknowledge receipt of this claim and provide your substantive response within 14 days of the date hereof. Failure to respond within the stated period will be taken as a rejection of this claim, and we reserve the right to commence arbitration proceedings without further notice.

Yours faithfully,

${data.claimant.name}`

  const legalNotice = `LEGAL NOTICE

Jurisdiction: ${getJurisdiction(data.claimType)}
Applicable Law: ${getApplicableLaw(data.claimType)}
Claim Reference: ${data.claimRef}
Limitation Period: 12 months from ${incidentDate} (expiring ${timeBarDate})

This letter is written without prejudice to any and all rights and remedies available to ${data.claimant.name}, all of which are expressly reserved.`

  return { subject, body, legalNotice }
}

/**
 * Generate a demurrage-specific claim letter with laytime calculation breakdown.
 *
 * Extends the standard claim letter with a detailed computation showing
 * laytime allowed, laytime used, excess time on demurrage, the demurrage rate,
 * and the resulting demurrage amount.
 *
 * @param data - Claim data extended with laytime/demurrage specifics
 * @returns Object containing subject, body text, and calculation breakdown
 */
export function generateDemurrageClaimLetter(
  data: ClaimData & {
    laytimeUsed: number
    laytimeAllowed: number
    demurrageRate: number
  }
): { subject: string; body: string; calculation: string } {
  const formattedAmount = formatCurrency(data.amount, data.currency)
  const incidentDate = formatDate(data.dateOfIncident)
  const timeBarDate = calculateTimeBarDate(data.dateOfIncident)
  const excessDays = Math.max(0, data.laytimeUsed - data.laytimeAllowed)
  const calculatedDemurrage = excessDays * data.demurrageRate

  const subject = `Demurrage Claim – Ref: ${data.claimRef} – MV "${data.vesselName}"`

  const calculation = `LAYTIME & DEMURRAGE CALCULATION

Vessel: MV "${data.vesselName}"
Voyage: ${data.voyageRef}
Load Port: ${data.loadPort}
Discharge Port: ${data.dischargePort}

Laytime Allowed:    ${data.laytimeAllowed.toFixed(4)} days
Laytime Used:       ${data.laytimeUsed.toFixed(4)} days
                    ──────────────────
Time on Demurrage:  ${excessDays.toFixed(4)} days

Demurrage Rate:     ${formatCurrency(data.demurrageRate, data.currency)} per day

Demurrage Due:      ${excessDays.toFixed(4)} days x ${formatCurrency(data.demurrageRate, data.currency)}/day
                    = ${formatCurrency(calculatedDemurrage, data.currency)}

Total Claimed:      ${formattedAmount}

Note: Any difference between the calculated demurrage and the total claimed amount may include additional costs such as detention, shifting expenses, or other ancillary charges as detailed in the supporting documents.`

  const body = `${data.claimant.name}
${data.claimant.address}

Date: ${formatDate(new Date().toISOString())}

To:
${data.respondent.name}
${data.respondent.address}

Re: ${subject}

Dear Sirs,

We write on behalf of ${data.claimant.name} to present our demurrage claim in respect of MV "${data.vesselName}" (Voyage Ref: ${data.voyageRef}).

BACKGROUND

The vessel performed a voyage from ${data.loadPort} to ${data.dischargePort}. Under the terms of the governing Charter Party, laytime of ${data.laytimeAllowed.toFixed(4)} days was allowed for cargo operations.

The actual laytime used amounted to ${data.laytimeUsed.toFixed(4)} days, resulting in ${excessDays.toFixed(4)} days on demurrage at the agreed rate of ${formatCurrency(data.demurrageRate, data.currency)} per day.

${data.description}

CLAIM AMOUNT

Based on the laytime calculation enclosed herewith, we claim the sum of ${formattedAmount} in respect of demurrage incurred.

Please find the detailed laytime calculation attached to this letter.

SUPPORTING DOCUMENTS

The following documents are relied upon in support of this claim:
${data.supportingDocs.length > 0 ? data.supportingDocs.map((doc, i) => `  ${i + 1}. ${doc}`).join('\n') : '  (To be provided under separate cover)'}

TIME BAR NOTICE

The time bar for this claim expires on ${timeBarDate}. This letter constitutes formal notification to preserve all rights within the applicable limitation period.

We request your acknowledgment of this claim and substantive response within 14 days. Failing which, we reserve the right to refer this matter to arbitration.

Yours faithfully,

${data.claimant.name}`

  return { subject, body, calculation }
}

/**
 * Generate a formal response letter to a received maritime claim.
 *
 * Handles both acceptance and rejection scenarios. When a counter-amount is
 * specified on rejection, a without-prejudice settlement offer is included.
 *
 * @param originalClaim - The original claim data being responded to
 * @param response - Response details including acceptance flag, optional counter-amount, and reason
 * @returns Object containing subject and body text of the response letter
 */
export function generateResponseLetter(
  originalClaim: ClaimData,
  response: { accepted: boolean; counterAmount?: number; reason: string }
): { subject: string; body: string } {
  const claimTypeLabel = CLAIM_TYPE_LABELS[originalClaim.claimType]
  const originalAmount = formatCurrency(originalClaim.amount, originalClaim.currency)

  const subject = `Response to ${claimTypeLabel} Claim – Ref: ${originalClaim.claimRef} – MV "${originalClaim.vesselName}"`

  let responseBody: string

  if (response.accepted) {
    responseBody = `We have reviewed the claim and the supporting documentation provided in connection with the above matter.

RESPONSE

After careful consideration, we accept liability in respect of this claim. ${response.reason}

We confirm our agreement to settle the claimed amount of ${originalAmount} and request that you provide your preferred payment details and any applicable settlement documentation for our processing.

We trust this brings the matter to a satisfactory conclusion. Please do not hesitate to contact us should you require any further information.`
  } else {
    const counterOfferParagraph =
      response.counterAmount !== undefined
        ? `\n\nWITHOUT PREJUDICE OFFER

Notwithstanding our denial of liability as stated above, and strictly without prejudice to our position, we are prepared to offer the sum of ${formatCurrency(response.counterAmount, originalClaim.currency)} in full and final settlement of this claim. This offer is made purely on a commercial basis and shall not be construed as an admission of liability.

This offer remains open for acceptance for a period of 30 days from the date of this letter.`
        : ''

    responseBody = `We have reviewed the claim and the supporting documentation provided in connection with the above matter.

RESPONSE

After careful consideration, we respectfully reject this claim for the following reasons:

${response.reason}

We therefore deny liability for the claimed amount of ${originalAmount} and request that you provide any additional evidence or documentation that you consider relevant to this matter.${counterOfferParagraph}

We reserve all our rights and defences in connection with this matter, including but not limited to the right to raise additional grounds of defence should this matter proceed to arbitration.`
  }

  const body = `${originalClaim.respondent.name}
${originalClaim.respondent.address}

Date: ${formatDate(new Date().toISOString())}

To:
${originalClaim.claimant.name}
${originalClaim.claimant.address}

Re: ${subject}

Dear Sirs,

We refer to your claim letter dated ${formatDate(originalClaim.dateOfIncident)} concerning MV "${originalClaim.vesselName}" (Voyage Ref: ${originalClaim.voyageRef}), ${originalClaim.loadPort} to ${originalClaim.dischargePort}.

${responseBody}

Yours faithfully,

${originalClaim.respondent.name}`

  return { subject, body }
}
