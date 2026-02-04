import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

/* ── GraphQL Queries ── */

const ETS_ALLOWANCES = gql`
  query EtsAllowances {
    etsAllowances {
      id vesselName year type quantity pricePerUnit totalCost currency source status
      surrenderDate tradeReference notes createdAt
    }
  }
`;

const ETS_BALANCE = gql`
  query EtsBalance($year: Int!) {
    etsAllowanceBalance(year: $year) {
      year totalAllocated totalPurchased totalSurrendered remaining totalCost
    }
  }
`;

const ESG_REPORTS = gql`
  query EsgReports {
    esgReports {
      id reportingPeriod year quarter scope1Emissions scope2Emissions scope3Emissions
      totalEmissions emissionIntensity renewableEnergy spillIncidents safetyIncidents
      poseidonScore seaCargoCharter carbonOffset offsetCost status publishedDate
    }
  }
`;

const CARBON_CREDITS = gql`
  query CarbonCredits {
    carbonCredits {
      id projectName registry creditType vintage quantity pricePerTonne totalCost
      status retiredDate retiredForVessel notes
    }
  }
`;

const CARBON_CREDIT_SUMMARY = gql`
  query CarbonCreditSummary {
    carbonCreditSummary {
      totalCredits activeCredits retiredCredits totalCost avgPricePerTonne
    }
  }
`;

const AVAILABLE_FUELS = gql`
  query AvailableFuels {
    availableFuels {
      fuelType category wttIntensity ttwFactor energyContent
    }
  }
`;

const CALCULATE_WELL_TO_WAKE = gql`
  query CalculateWellToWake($input: WellToWakeInput!) {
    calculateWellToWake(input: $input) {
      fuelType fuelConsumedMt
      wttEmissionsMt wttIntensity
      ttwEmissionsMt ttwIntensity
      wtwEmissionsMt wtwIntensity
      breakdown { extraction refining transport combustion }
      vsHFO vsVLSFO
      energyContentMJ totalEnergyMJ
    }
  }
`;

const COMPARE_FUELS = gql`
  query CompareFuels($input: FuelComparisonInput!) {
    compareFuels(input: $input) {
      fuels {
        fuelType wtwEmissionsMt wtwIntensity vsHFO vsVLSFO
        breakdown { extraction refining transport combustion }
      }
      bestFuel worstFuel potentialSavingsMt potentialSavingsPercent
    }
  }
`;

/* ── GraphQL Mutations ── */

const PURCHASE_ETS = gql`
  mutation PurchaseEtsAllowance(
    $vesselName: String, $year: Int!, $quantity: Float!, $pricePerUnit: Float!,
    $source: String!, $counterparty: String, $notes: String
  ) {
    purchaseEtsAllowance(
      vesselName: $vesselName, year: $year, quantity: $quantity, pricePerUnit: $pricePerUnit,
      source: $source, counterparty: $counterparty, notes: $notes
    ) { id }
  }
`;

const SURRENDER_ETS = gql`
  mutation SurrenderEtsAllowance($id: String!) {
    surrenderEtsAllowance(id: $id) { id }
  }
`;

const PURCHASE_CREDIT = gql`
  mutation PurchaseCarbonCredit(
    $projectName: String!, $registry: String!, $creditType: String!, $vintage: Int!,
    $quantity: Float!, $pricePerTonne: Float!, $verificationStandard: String,
    $projectCountry: String, $notes: String
  ) {
    purchaseCarbonCredit(
      projectName: $projectName, registry: $registry, creditType: $creditType, vintage: $vintage,
      quantity: $quantity, pricePerTonne: $pricePerTonne, verificationStandard: $verificationStandard,
      projectCountry: $projectCountry, notes: $notes
    ) { id }
  }
`;

const RETIRE_CREDIT = gql`
  mutation RetireCarbonCredit($id: String!, $vesselName: String, $voyageReference: String) {
    retireCarbonCredit(id: $id, vesselName: $vesselName, voyageReference: $voyageReference) { id }
  }
`;

const CREATE_ESG = gql`
  mutation CreateEsgReport(
    $year: Int!, $quarter: Int, $scope1Emissions: Float!, $scope2Emissions: Float!,
    $scope3Emissions: Float!, $emissionIntensity: Float, $renewableEnergy: Float,
    $spillIncidents: Int, $safetyIncidents: Int, $poseidonScore: Float,
    $seaCargoCharter: Float, $notes: String
  ) {
    createEsgReport(
      year: $year, quarter: $quarter, scope1Emissions: $scope1Emissions,
      scope2Emissions: $scope2Emissions, scope3Emissions: $scope3Emissions,
      emissionIntensity: $emissionIntensity, renewableEnergy: $renewableEnergy,
      spillIncidents: $spillIncidents, safetyIncidents: $safetyIncidents,
      poseidonScore: $poseidonScore, seaCargoCharter: $seaCargoCharter, notes: $notes
    ) { id }
  }
`;

const PUBLISH_ESG = gql`
  mutation PublishEsgReport($id: String!) {
    publishEsgReport(id: $id) { id }
  }
`;

/* ── Helpers ── */

function fmtNum(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '-';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtCurrency(n: number | null | undefined, currency = 'EUR'): string {
  if (n == null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const tabs = ['Overview', 'EU ETS Allowances', 'ESG Reports', 'Carbon Credits', 'Well-to-Wake Analysis'] as const;
type Tab = typeof tabs[number];

const etsSourceOptions = ['EEX', 'ICE', 'OTC', 'allocation'] as const;
const registryOptions = ['verra', 'gold_standard', 'cdm', 'acr', 'car'] as const;
const creditTypeOptions = ['avoidance', 'removal', 'reduction'] as const;

const registryBadge: Record<string, string> = {
  verra: 'bg-green-900/50 text-green-400',
  gold_standard: 'bg-yellow-900/50 text-yellow-400',
  cdm: 'bg-blue-900/50 text-blue-400',
  acr: 'bg-purple-900/50 text-purple-400',
  car: 'bg-cyan-900/50 text-cyan-400',
};

const etsTypeBadge: Record<string, string> = {
  purchase: 'bg-blue-900/50 text-blue-400',
  surrender: 'bg-red-900/50 text-red-400',
  carry_over: 'bg-yellow-900/50 text-yellow-400',
  allocation: 'bg-green-900/50 text-green-400',
};

const esgStatusBadge: Record<string, string> = {
  draft: 'bg-maritime-700 text-maritime-300',
  review: 'bg-yellow-900/50 text-yellow-400',
  published: 'bg-green-900/50 text-green-400',
};

/* ── Empty Forms ── */

const emptyEtsForm = {
  vesselName: '', year: '2025', quantity: '', pricePerUnit: '', source: 'EEX', counterparty: '', notes: '',
};

const emptyEsgForm = {
  year: '2025', quarter: '', scope1Emissions: '', scope2Emissions: '', scope3Emissions: '',
  emissionIntensity: '', renewableEnergy: '', spillIncidents: '', safetyIncidents: '',
  poseidonScore: '', seaCargoCharter: '', notes: '',
};

const emptyCreditForm = {
  projectName: '', registry: 'verra', creditType: 'avoidance', vintage: '2024',
  quantity: '', pricePerTonne: '', verificationStandard: '', projectCountry: '', notes: '',
};

const emptyRetireForm = {
  vesselName: '', voyageReference: '',
};

/* ── Main Component ── */

export function CarbonDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [etsYear, setEtsYear] = useState(2025);
  const [showPurchaseEts, setShowPurchaseEts] = useState(false);
  const [showCreateEsg, setShowCreateEsg] = useState(false);
  const [showPurchaseCredit, setShowPurchaseCredit] = useState(false);
  const [showRetireCredit, setShowRetireCredit] = useState(false);
  const [retireCreditId, setRetireCreditId] = useState<string | null>(null);
  const [expandedEsg, setExpandedEsg] = useState<string | null>(null);

  const [etsForm, setEtsForm] = useState(emptyEtsForm);
  const [esgForm, setEsgForm] = useState(emptyEsgForm);
  const [creditForm, setCreditForm] = useState(emptyCreditForm);
  const [retireForm, setRetireForm] = useState(emptyRetireForm);

  /* Queries */
  const { data: etsData, loading: etsLoading, refetch: refetchEts } = useQuery(ETS_ALLOWANCES);
  const { data: balData, refetch: refetchBal } = useQuery(ETS_BALANCE, { variables: { year: etsYear } });
  const { data: esgData, loading: esgLoading, refetch: refetchEsg } = useQuery(ESG_REPORTS);
  const { data: ccData, loading: ccLoading, refetch: refetchCc } = useQuery(CARBON_CREDITS);
  const { data: ccSumData, refetch: refetchCcSum } = useQuery(CARBON_CREDIT_SUMMARY);

  /* Mutations */
  const [purchaseEts, { loading: purchasingEts }] = useMutation(PURCHASE_ETS);
  const [surrenderEts] = useMutation(SURRENDER_ETS);
  const [purchaseCredit, { loading: purchasingCredit }] = useMutation(PURCHASE_CREDIT);
  const [retireCredit, { loading: retiringCredit }] = useMutation(RETIRE_CREDIT);
  const [createEsg, { loading: creatingEsg }] = useMutation(CREATE_ESG);
  const [publishEsg] = useMutation(PUBLISH_ESG);

  /* Derived data */
  const allowances = etsData?.etsAllowances ?? [];
  const balance = balData?.etsAllowanceBalance;
  const esgReports = esgData?.esgReports ?? [];
  const credits = ccData?.carbonCredits ?? [];
  const ccSummary = ccSumData?.carbonCreditSummary;

  const latestEsg = esgReports.length > 0 ? esgReports[0] : null;
  const totalCo2 = latestEsg?.totalEmissions ?? 0;
  const totalRetiredCredits = ccSummary?.retiredCredits ?? 0;

  /* Handlers */
  const setEts = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEtsForm((f) => ({ ...f, [field]: e.target.value }));

  const setEsg = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEsgForm((f) => ({ ...f, [field]: e.target.value }));

  const setCred = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCreditForm((f) => ({ ...f, [field]: e.target.value }));

  const setRetire = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setRetireForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePurchaseEts = async (e: React.FormEvent) => {
    e.preventDefault();
    await purchaseEts({
      variables: {
        vesselName: etsForm.vesselName || null,
        year: Number(etsForm.year),
        quantity: Number(etsForm.quantity),
        pricePerUnit: Number(etsForm.pricePerUnit),
        source: etsForm.source,
        counterparty: etsForm.counterparty || null,
        notes: etsForm.notes || null,
      },
    });
    setEtsForm(emptyEtsForm);
    setShowPurchaseEts(false);
    refetchEts();
    refetchBal();
  };

  const handleSurrenderEts = async (id: string) => {
    if (!confirm('Surrender this ETS allowance? This action cannot be undone.')) return;
    await surrenderEts({ variables: { id } });
    refetchEts();
    refetchBal();
  };

  const handleCreateEsg = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEsg({
      variables: {
        year: Number(esgForm.year),
        quarter: esgForm.quarter ? Number(esgForm.quarter) : null,
        scope1Emissions: Number(esgForm.scope1Emissions),
        scope2Emissions: Number(esgForm.scope2Emissions),
        scope3Emissions: Number(esgForm.scope3Emissions),
        emissionIntensity: esgForm.emissionIntensity ? Number(esgForm.emissionIntensity) : null,
        renewableEnergy: esgForm.renewableEnergy ? Number(esgForm.renewableEnergy) : null,
        spillIncidents: esgForm.spillIncidents ? Number(esgForm.spillIncidents) : null,
        safetyIncidents: esgForm.safetyIncidents ? Number(esgForm.safetyIncidents) : null,
        poseidonScore: esgForm.poseidonScore ? Number(esgForm.poseidonScore) : null,
        seaCargoCharter: esgForm.seaCargoCharter ? Number(esgForm.seaCargoCharter) : null,
        notes: esgForm.notes || null,
      },
    });
    setEsgForm(emptyEsgForm);
    setShowCreateEsg(false);
    refetchEsg();
  };

  const handlePublishEsg = async (id: string) => {
    if (!confirm('Publish this ESG report? It will become publicly visible.')) return;
    await publishEsg({ variables: { id } });
    refetchEsg();
  };

  const handlePurchaseCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    await purchaseCredit({
      variables: {
        projectName: creditForm.projectName,
        registry: creditForm.registry,
        creditType: creditForm.creditType,
        vintage: Number(creditForm.vintage),
        quantity: Number(creditForm.quantity),
        pricePerTonne: Number(creditForm.pricePerTonne),
        verificationStandard: creditForm.verificationStandard || null,
        projectCountry: creditForm.projectCountry || null,
        notes: creditForm.notes || null,
      },
    });
    setCreditForm(emptyCreditForm);
    setShowPurchaseCredit(false);
    refetchCc();
    refetchCcSum();
  };

  const handleRetireCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retireCreditId) return;
    await retireCredit({
      variables: {
        id: retireCreditId,
        vesselName: retireForm.vesselName || null,
        voyageReference: retireForm.voyageReference || null,
      },
    });
    setRetireForm(emptyRetireForm);
    setRetireCreditId(null);
    setShowRetireCredit(false);
    refetchCc();
    refetchCcSum();
  };

  const openRetireModal = (id: string) => {
    setRetireCreditId(id);
    setRetireForm(emptyRetireForm);
    setShowRetireCredit(true);
  };

  /* ── Render ── */

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Carbon & ESG Dashboard</h1>
          <p className="text-maritime-400 text-sm mt-1">
            EU ETS compliance, carbon credits, and ESG reporting
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-maritime-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-white border-blue-500'
                : 'text-maritime-400 border-transparent hover:text-maritime-300 hover:border-maritime-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <OverviewTab
          totalCo2={totalCo2}
          latestEsg={latestEsg}
          balance={balance}
          totalRetiredCredits={totalRetiredCredits}
          esgReports={esgReports}
          onPurchaseAllowances={() => { setActiveTab('EU ETS Allowances'); setShowPurchaseEts(true); }}
          onRetireCredits={() => setActiveTab('Carbon Credits')}
          onNewEsgReport={() => { setActiveTab('ESG Reports'); setShowCreateEsg(true); }}
        />
      )}

      {activeTab === 'EU ETS Allowances' && (
        <EtsTab
          allowances={allowances}
          balance={balance}
          loading={etsLoading}
          etsYear={etsYear}
          setEtsYear={setEtsYear}
          onPurchase={() => setShowPurchaseEts(true)}
          onSurrender={handleSurrenderEts}
          refetchBal={refetchBal}
        />
      )}

      {activeTab === 'ESG Reports' && (
        <EsgTab
          reports={esgReports}
          loading={esgLoading}
          expandedId={expandedEsg}
          toggleExpand={(id: string) => setExpandedEsg(expandedEsg === id ? null : id)}
          onCreateReport={() => setShowCreateEsg(true)}
          onPublish={handlePublishEsg}
        />
      )}

      {activeTab === 'Carbon Credits' && (
        <CarbonCreditsTab
          credits={credits}
          summary={ccSummary}
          loading={ccLoading}
          onPurchase={() => setShowPurchaseCredit(true)}
          onRetire={openRetireModal}
        />
      )}

      {activeTab === 'Well-to-Wake Analysis' && (
        <WellToWakeTab />
      )}

      {/* ── Modals ── */}

      {/* Purchase ETS Allowance */}
      <Modal open={showPurchaseEts} onClose={() => setShowPurchaseEts(false)} title="Purchase ETS Allowance">
        <form onSubmit={handlePurchaseEts}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel (optional)">
              <input value={etsForm.vesselName} onChange={setEts('vesselName')} className={inputClass} placeholder="MV Ankr Star" />
            </FormField>
            <FormField label="Year *">
              <select value={etsForm.year} onChange={setEts('year')} className={selectClass} required>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </FormField>
            <FormField label="Quantity (tonnes) *">
              <input type="number" value={etsForm.quantity} onChange={setEts('quantity')} className={inputClass} required placeholder="1000" step="0.01" />
            </FormField>
            <FormField label="Price/Unit (EUR) *">
              <input type="number" value={etsForm.pricePerUnit} onChange={setEts('pricePerUnit')} className={inputClass} required placeholder="85.50" step="0.01" />
            </FormField>
            <FormField label="Source *">
              <select value={etsForm.source} onChange={setEts('source')} className={selectClass} required>
                {etsSourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Counterparty">
              <input value={etsForm.counterparty} onChange={setEts('counterparty')} className={inputClass} placeholder="Broker name" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={etsForm.notes} onChange={setEts('notes')} className={inputClass} rows={2} placeholder="Additional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowPurchaseEts(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={purchasingEts} className={btnPrimary}>
              {purchasingEts ? 'Purchasing...' : 'Purchase Allowance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create ESG Report */}
      <Modal open={showCreateEsg} onClose={() => setShowCreateEsg(false)} title="Create ESG Report">
        <form onSubmit={handleCreateEsg}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Year *">
              <select value={esgForm.year} onChange={setEsg('year')} className={selectClass} required>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </FormField>
            <FormField label="Quarter (blank for annual)">
              <select value={esgForm.quarter} onChange={setEsg('quarter')} className={selectClass}>
                <option value="">Annual</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
            </FormField>
            <FormField label="Scope 1 Emissions (t CO2) *">
              <input type="number" value={esgForm.scope1Emissions} onChange={setEsg('scope1Emissions')} className={inputClass} required placeholder="50000" step="0.01" />
            </FormField>
            <FormField label="Scope 2 Emissions (t CO2) *">
              <input type="number" value={esgForm.scope2Emissions} onChange={setEsg('scope2Emissions')} className={inputClass} required placeholder="5000" step="0.01" />
            </FormField>
            <FormField label="Scope 3 Emissions (t CO2) *">
              <input type="number" value={esgForm.scope3Emissions} onChange={setEsg('scope3Emissions')} className={inputClass} required placeholder="15000" step="0.01" />
            </FormField>
            <FormField label="Emission Intensity">
              <input type="number" value={esgForm.emissionIntensity} onChange={setEsg('emissionIntensity')} className={inputClass} placeholder="8.5" step="0.01" />
            </FormField>
            <FormField label="Renewable Energy (%)">
              <input type="number" value={esgForm.renewableEnergy} onChange={setEsg('renewableEnergy')} className={inputClass} placeholder="12" step="0.1" />
            </FormField>
            <FormField label="Spill Incidents">
              <input type="number" value={esgForm.spillIncidents} onChange={setEsg('spillIncidents')} className={inputClass} placeholder="0" step="1" />
            </FormField>
            <FormField label="Safety Incidents">
              <input type="number" value={esgForm.safetyIncidents} onChange={setEsg('safetyIncidents')} className={inputClass} placeholder="2" step="1" />
            </FormField>
            <FormField label="Poseidon Score">
              <input type="number" value={esgForm.poseidonScore} onChange={setEsg('poseidonScore')} className={inputClass} placeholder="0.85" step="0.01" />
            </FormField>
            <FormField label="Sea Cargo Charter Score">
              <input type="number" value={esgForm.seaCargoCharter} onChange={setEsg('seaCargoCharter')} className={inputClass} placeholder="0.90" step="0.01" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={esgForm.notes} onChange={setEsg('notes')} className={inputClass} rows={2} placeholder="Report notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowCreateEsg(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creatingEsg} className={btnPrimary}>
              {creatingEsg ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Purchase Carbon Credit */}
      <Modal open={showPurchaseCredit} onClose={() => setShowPurchaseCredit(false)} title="Purchase Carbon Credit">
        <form onSubmit={handlePurchaseCredit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Project Name *">
                <input value={creditForm.projectName} onChange={setCred('projectName')} className={inputClass} required placeholder="Wind Farm Project - Gujarat" />
              </FormField>
            </div>
            <FormField label="Registry *">
              <select value={creditForm.registry} onChange={setCred('registry')} className={selectClass} required>
                {registryOptions.map((r) => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </FormField>
            <FormField label="Credit Type *">
              <select value={creditForm.creditType} onChange={setCred('creditType')} className={selectClass} required>
                {creditTypeOptions.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </FormField>
            <FormField label="Vintage *">
              <input type="number" value={creditForm.vintage} onChange={setCred('vintage')} className={inputClass} required placeholder="2024" />
            </FormField>
            <FormField label="Quantity (tonnes) *">
              <input type="number" value={creditForm.quantity} onChange={setCred('quantity')} className={inputClass} required placeholder="5000" step="0.01" />
            </FormField>
            <FormField label="Price/Tonne (USD) *">
              <input type="number" value={creditForm.pricePerTonne} onChange={setCred('pricePerTonne')} className={inputClass} required placeholder="12.50" step="0.01" />
            </FormField>
            <FormField label="Verification Standard">
              <input value={creditForm.verificationStandard} onChange={setCred('verificationStandard')} className={inputClass} placeholder="VCS" />
            </FormField>
            <FormField label="Project Country">
              <input value={creditForm.projectCountry} onChange={setCred('projectCountry')} className={inputClass} placeholder="India" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={creditForm.notes} onChange={setCred('notes')} className={inputClass} rows={2} placeholder="Credit notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowPurchaseCredit(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={purchasingCredit} className={btnPrimary}>
              {purchasingCredit ? 'Purchasing...' : 'Purchase Credit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Retire Carbon Credit */}
      <Modal open={showRetireCredit} onClose={() => setShowRetireCredit(false)} title="Retire Carbon Credit">
        <form onSubmit={handleRetireCredit}>
          <p className="text-maritime-300 text-sm mb-4">
            Retiring a carbon credit permanently offsets it against vessel emissions. This action cannot be reversed.
          </p>
          <FormField label="Vessel Name (optional)">
            <input value={retireForm.vesselName} onChange={setRetire('vesselName')} className={inputClass} placeholder="MV Ankr Star" />
          </FormField>
          <FormField label="Voyage Reference (optional)">
            <input value={retireForm.voyageReference} onChange={setRetire('voyageReference')} className={inputClass} placeholder="VOY-2025-001" />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowRetireCredit(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={retiringCredit} className={btnPrimary}>
              {retiringCredit ? 'Retiring...' : 'Confirm Retirement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 1: Overview
   ══════════════════════════════════════════════════════════════════ */

function OverviewTab({
  totalCo2, latestEsg, balance, totalRetiredCredits, esgReports,
  onPurchaseAllowances, onRetireCredits, onNewEsgReport,
}: {
  totalCo2: number;
  latestEsg: Record<string, unknown> | null;
  balance: Record<string, unknown> | null;
  totalRetiredCredits: number;
  esgReports: Record<string, unknown>[];
  onPurchaseAllowances: () => void;
  onRetireCredits: () => void;
  onNewEsgReport: () => void;
}) {
  const poseidonScore = latestEsg?.poseidonScore as number | null;
  const etsLiability = balance?.totalCost as number ?? 0;
  const ciiAvg = latestEsg?.emissionIntensity as number | null;
  const esgScore = latestEsg ? (
    100 - ((latestEsg.spillIncidents as number ?? 0) * 5) - ((latestEsg.safetyIncidents as number ?? 0) * 2)
  ) : null;

  /* Build simple stacked bar data from latest 5 ESG reports */
  const recentReports = esgReports.slice(0, 5).reverse();

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <SummaryCard label="Total CO2 Emissions" value={`${fmtNum(totalCo2, 0)} t`} color="text-red-400" />
        <SummaryCard label="CII Fleet Avg" value={ciiAvg != null ? fmtNum(ciiAvg) : '-'} color="text-yellow-400" />
        <SummaryCard label="ETS Liability" value={fmtCurrency(etsLiability)} color="text-blue-400" />
        <SummaryCard label="Credits Retired" value={`${fmtNum(totalRetiredCredits, 0)} t`} color="text-green-400" />
        <SummaryCard label="ESG Score" value={esgScore != null ? `${esgScore}/100` : '-'} color="text-cyan-400" />
        <SummaryCard label="Poseidon Alignment" value={poseidonScore != null ? fmtNum(poseidonScore) : '-'} color="text-purple-400" />
      </div>

      {/* Emissions Trend Chart (placeholder stacked bar) */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 mb-8">
        <h3 className="text-white font-semibold mb-4">Emissions Trend</h3>
        {recentReports.length === 0 ? (
          <p className="text-maritime-500 text-sm text-center py-8">No ESG reports available to display trend</p>
        ) : (
          <div className="flex items-end gap-3 h-48">
            {recentReports.map((r) => {
              const s1 = (r.scope1Emissions as number) || 0;
              const s2 = (r.scope2Emissions as number) || 0;
              const s3 = (r.scope3Emissions as number) || 0;
              const total = s1 + s2 + s3;
              const maxVal = Math.max(...recentReports.map((rr) =>
                ((rr.scope1Emissions as number) || 0) + ((rr.scope2Emissions as number) || 0) + ((rr.scope3Emissions as number) || 0)
              ));
              const heightPct = maxVal > 0 ? (total / maxVal) * 100 : 0;
              const s1Pct = total > 0 ? (s1 / total) * 100 : 0;
              const s2Pct = total > 0 ? (s2 / total) * 100 : 0;
              const s3Pct = total > 0 ? (s3 / total) * 100 : 0;
              const label = (r.quarter as number) ? `Q${r.quarter} ${r.year}` : `${r.year}`;

              return (
                <div key={r.id as string} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                    <div className="w-full rounded-t overflow-hidden" style={{ height: `${heightPct}%` }}>
                      <div className="bg-red-500/80 w-full" style={{ height: `${s1Pct}%` }} title={`Scope 1: ${fmtNum(s1, 0)}t`} />
                      <div className="bg-yellow-500/80 w-full" style={{ height: `${s2Pct}%` }} title={`Scope 2: ${fmtNum(s2, 0)}t`} />
                      <div className="bg-blue-500/80 w-full" style={{ height: `${s3Pct}%` }} title={`Scope 3: ${fmtNum(s3, 0)}t`} />
                    </div>
                  </div>
                  <span className="text-maritime-400 text-xs mt-2">{label}</span>
                </div>
              );
            })}
          </div>
        )}
        {recentReports.length > 0 && (
          <div className="flex items-center gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/80" />
              <span className="text-maritime-400 text-xs">Scope 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500/80" />
              <span className="text-maritime-400 text-xs">Scope 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/80" />
              <span className="text-maritime-400 text-xs">Scope 3</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <button onClick={onPurchaseAllowances} className={btnPrimary}>Purchase Allowances</button>
          <button onClick={onRetireCredits} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
            Retire Credits
          </button>
          <button onClick={onNewEsgReport} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
            New ESG Report
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 2: EU ETS Allowances
   ══════════════════════════════════════════════════════════════════ */

function EtsTab({
  allowances, balance, loading, etsYear, setEtsYear, onPurchase, onSurrender, refetchBal,
}: {
  allowances: Record<string, unknown>[];
  balance: Record<string, unknown> | null;
  loading: boolean;
  etsYear: number;
  setEtsYear: (y: number) => void;
  onPurchase: () => void;
  onSurrender: (id: string) => void;
  refetchBal: () => void;
}) {
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEtsYear(Number(e.target.value));
    setTimeout(() => refetchBal(), 0);
  };

  return (
    <div>
      {/* Year selector + action */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <label className="text-maritime-400 text-sm">Year:</label>
          <select
            value={etsYear}
            onChange={handleYearChange}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
        <button onClick={onPurchase} className={btnPrimary}>+ Purchase Allowance</button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Allocated" value={fmtNum(balance?.totalAllocated as number ?? 0, 0)} color="text-green-400" />
        <SummaryCard label="Purchased" value={fmtNum(balance?.totalPurchased as number ?? 0, 0)} color="text-blue-400" />
        <SummaryCard label="Surrendered" value={fmtNum(balance?.totalSurrendered as number ?? 0, 0)} color="text-red-400" />
        <SummaryCard label="Remaining" value={fmtNum(balance?.remaining as number ?? 0, 0)} color="text-cyan-400" />
      </div>

      {/* Allowances Table */}
      {loading ? (
        <p className="text-maritime-400">Loading ETS allowances...</p>
      ) : (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Vessel</th>
                <th className="text-center px-4 py-3 font-medium">Year</th>
                <th className="text-center px-4 py-3 font-medium">Type</th>
                <th className="text-right px-4 py-3 font-medium">Quantity</th>
                <th className="text-right px-4 py-3 font-medium">Price/Unit</th>
                <th className="text-right px-4 py-3 font-medium">Total Cost</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allowances.map((a) => (
                <tr key={a.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium">{(a.vesselName as string) || 'Fleet-wide'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-center">{a.year as number}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${etsTypeBadge[a.type as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {(a.type as string).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(a.quantity as number, 0)}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{fmtCurrency(a.pricePerUnit as number)}</td>
                  <td className="px-4 py-3 text-white text-right font-medium">{fmtCurrency(a.totalCost as number)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.status === 'active' ? 'bg-green-900/50 text-green-400'
                        : a.status === 'surrendered' ? 'bg-red-900/50 text-red-400'
                        : 'bg-maritime-700 text-maritime-300'
                    }`}>
                      {a.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.status === 'active' && (
                      <button
                        onClick={() => onSurrender(a.id as string)}
                        className="text-red-400/70 hover:text-red-400 text-xs font-medium"
                      >
                        Surrender
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allowances.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No ETS allowances found</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 3: ESG Reports
   ══════════════════════════════════════════════════════════════════ */

function EsgTab({
  reports, loading, expandedId, toggleExpand, onCreateReport, onPublish,
}: {
  reports: Record<string, unknown>[];
  loading: boolean;
  expandedId: string | null;
  toggleExpand: (id: string) => void;
  onCreateReport: () => void;
  onPublish: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold">ESG Reports</h3>
        <button onClick={onCreateReport} className={btnPrimary}>+ New ESG Report</button>
      </div>

      {loading ? (
        <p className="text-maritime-400">Loading ESG reports...</p>
      ) : (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium w-8" />
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-right px-4 py-3 font-medium">Scope 1</th>
                <th className="text-right px-4 py-3 font-medium">Scope 2</th>
                <th className="text-right px-4 py-3 font-medium">Scope 3</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Intensity</th>
                <th className="text-right px-4 py-3 font-medium">Renewables</th>
                <th className="text-center px-4 py-3 font-medium">Spills</th>
                <th className="text-right px-4 py-3 font-medium">Poseidon</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const id = r.id as string;
                const isExpanded = expandedId === id;
                const period = (r.quarter as number) ? `Q${r.quarter} ${r.year}` : `FY ${r.year}`;

                return (
                  <>
                    <tr key={id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30 cursor-pointer" onClick={() => toggleExpand(id)}>
                      <td className="px-4 py-3 text-maritime-400">
                        <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{period}</td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(r.scope1Emissions as number, 0)}</td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(r.scope2Emissions as number, 0)}</td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(r.scope3Emissions as number, 0)}</td>
                      <td className="px-4 py-3 text-white text-right font-medium">{fmtNum(r.totalEmissions as number, 0)}</td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(r.emissionIntensity as number)}</td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{r.renewableEnergy != null ? `${fmtNum(r.renewableEnergy as number, 1)}%` : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`${(r.spillIncidents as number ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {r.spillIncidents as number ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(r.poseidonScore as number)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${esgStatusBadge[r.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {r.status as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {r.status !== 'published' && (
                          <button
                            onClick={() => onPublish(id)}
                            className="text-green-400/70 hover:text-green-400 text-xs font-medium"
                          >
                            Publish
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${id}-detail`} className="border-b border-maritime-700/50 bg-maritime-900/50">
                        <td colSpan={12} className="px-8 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-maritime-500 text-xs">Safety Incidents</span>
                              <p className="text-white font-medium">{r.safetyIncidents as number ?? '-'}</p>
                            </div>
                            <div>
                              <span className="text-maritime-500 text-xs">Carbon Offset (t)</span>
                              <p className="text-white font-medium">{fmtNum(r.carbonOffset as number, 0)}</p>
                            </div>
                            <div>
                              <span className="text-maritime-500 text-xs">Offset Cost</span>
                              <p className="text-white font-medium">{fmtCurrency(r.offsetCost as number, 'USD')}</p>
                            </div>
                            <div>
                              <span className="text-maritime-500 text-xs">Sea Cargo Charter</span>
                              <p className="text-white font-medium">{fmtNum(r.seaCargoCharter as number)}</p>
                            </div>
                            <div>
                              <span className="text-maritime-500 text-xs">Reporting Period</span>
                              <p className="text-white font-medium">{(r.reportingPeriod as string) || '-'}</p>
                            </div>
                            <div>
                              <span className="text-maritime-500 text-xs">Published Date</span>
                              <p className="text-white font-medium">{fmtDate(r.publishedDate as string)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {reports.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No ESG reports found</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 4: Carbon Credits
   ══════════════════════════════════════════════════════════════════ */

function CarbonCreditsTab({
  credits, summary, loading, onPurchase, onRetire,
}: {
  credits: Record<string, unknown>[];
  summary: Record<string, unknown> | null;
  loading: boolean;
  onPurchase: () => void;
  onRetire: (id: string) => void;
}) {
  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <SummaryCard label="Total Credits" value={fmtNum(summary?.totalCredits as number ?? 0, 0)} color="text-white" />
        <SummaryCard label="Active" value={fmtNum(summary?.activeCredits as number ?? 0, 0)} color="text-green-400" />
        <SummaryCard label="Retired" value={fmtNum(summary?.retiredCredits as number ?? 0, 0)} color="text-red-400" />
        <SummaryCard label="Total Cost" value={fmtCurrency(summary?.totalCost as number ?? 0, 'USD')} color="text-blue-400" />
        <SummaryCard label="Avg Price/Tonne" value={fmtCurrency(summary?.avgPricePerTonne as number ?? 0, 'USD')} color="text-yellow-400" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Carbon Credits</h3>
        <button onClick={onPurchase} className={btnPrimary}>+ Purchase Credit</button>
      </div>

      {loading ? (
        <p className="text-maritime-400">Loading carbon credits...</p>
      ) : (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Project Name</th>
                <th className="text-center px-4 py-3 font-medium">Registry</th>
                <th className="text-center px-4 py-3 font-medium">Type</th>
                <th className="text-center px-4 py-3 font-medium">Vintage</th>
                <th className="text-right px-4 py-3 font-medium">Quantity</th>
                <th className="text-right px-4 py-3 font-medium">Price/t</th>
                <th className="text-right px-4 py-3 font-medium">Total Cost</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credits.map((c) => (
                <tr key={c.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium">{c.projectName as string}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${registryBadge[c.registry as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {(c.registry as string).replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-center capitalize">{c.creditType as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-center">{c.vintage as number}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{fmtNum(c.quantity as number, 0)}</td>
                  <td className="px-4 py-3 text-maritime-300 text-right">{fmtCurrency(c.pricePerTonne as number, 'USD')}</td>
                  <td className="px-4 py-3 text-white text-right font-medium">{fmtCurrency(c.totalCost as number, 'USD')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'active' ? 'bg-green-900/50 text-green-400'
                        : c.status === 'retired' ? 'bg-red-900/50 text-red-400'
                        : 'bg-maritime-700 text-maritime-300'
                    }`}>
                      {c.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.status === 'active' && (
                      <button
                        onClick={() => onRetire(c.id as string)}
                        className="text-yellow-400/70 hover:text-yellow-400 text-xs font-medium"
                      >
                        Retire
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {credits.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No carbon credits found</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Shared: Summary Card
   ══════════════════════════════════════════════════════════════════ */

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
      <p className="text-maritime-400 text-xs font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 5: Well-to-Wake Analysis
   ══════════════════════════════════════════════════════════════════ */

function WellToWakeTab() {
  const { t } = useTranslation();
  const [fuelType, setFuelType] = useState('vlsfo');
  const [fuelAmount, setFuelAmount] = useState('1000');
  const [includeTransport, setIncludeTransport] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedFuels, setSelectedFuels] = useState<string[]>(['vlsfo', 'lng', 'methanol']);

  const { data: fuelsData } = useQuery(AVAILABLE_FUELS);
  const availableFuels = fuelsData?.availableFuels || [];

  const { data: wtwData, loading: wtwLoading } = useQuery(CALCULATE_WELL_TO_WAKE, {
    variables: {
      input: {
        fuelType,
        fuelConsumedMt: parseFloat(fuelAmount) || 1000,
        includeTransport,
      },
    },
    skip: compareMode,
  });

  const { data: compareData, loading: compareLoading } = useQuery(COMPARE_FUELS, {
    variables: {
      input: {
        fuelTypes: selectedFuels,
        fuelConsumedMt: parseFloat(fuelAmount) || 1000,
        includeTransport,
      },
    },
    skip: !compareMode,
  });

  const wtw = wtwData?.calculateWellToWake;
  const comparison = compareData?.compareFuels;

  const fuelsByCategory = availableFuels.reduce((acc: any, fuel: any) => {
    if (!acc[fuel.category]) acc[fuel.category] = [];
    acc[fuel.category].push(fuel);
    return acc;
  }, {});

  const toggleFuel = (fuel: string) => {
    if (selectedFuels.includes(fuel)) {
      setSelectedFuels(selectedFuels.filter(f => f !== fuel));
    } else {
      setSelectedFuels([...selectedFuels, fuel]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Well-to-Wake Lifecycle Analysis</h2>
          <p className="text-maritime-400 text-sm mt-1">
            Complete lifecycle emissions (upstream production + combustion)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCompareMode(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !compareMode
                ? 'bg-maritime-600 text-white'
                : 'bg-maritime-800 text-maritime-400 hover:bg-maritime-700'
            }`}
          >
            Single Fuel
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              compareMode
                ? 'bg-maritime-600 text-white'
                : 'bg-maritime-800 text-maritime-400 hover:bg-maritime-700'
            }`}
          >
            Compare Fuels
          </button>
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-maritime-400 text-sm font-medium mb-2">
              Fuel Amount (mt)
            </label>
            <input
              type="number"
              value={fuelAmount}
              onChange={(e) => setFuelAmount(e.target.value)}
              className={inputClass}
              placeholder="1000"
              step="0.01"
            />
          </div>

          {!compareMode && (
            <div>
              <label className="block text-maritime-400 text-sm font-medium mb-2">
                Fuel Type
              </label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={selectClass}>
                {Object.entries(fuelsByCategory).map(([category, fuels]: [string, any]) => (
                  <optgroup key={category} label={category}>
                    {fuels.map((fuel: any) => (
                      <option key={fuel.fuelType} value={fuel.fuelType}>
                        {fuel.fuelType.toUpperCase().replace(/_/g, ' ')}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTransport}
                onChange={(e) => setIncludeTransport(e.target.checked)}
                className="w-4 h-4 rounded border-maritime-600 text-maritime-500 focus:ring-maritime-500"
              />
              <span className="text-sm text-maritime-300">Include fuel transport emissions</span>
            </label>
          </div>
        </div>

        {compareMode && (
          <div className="mt-6">
            <label className="block text-maritime-400 text-sm font-medium mb-3">
              Select Fuels to Compare ({selectedFuels.length} selected)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableFuels.map((fuel: any) => (
                <button
                  key={fuel.fuelType}
                  onClick={() => toggleFuel(fuel.fuelType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFuels.includes(fuel.fuelType)
                      ? 'bg-maritime-600 text-white'
                      : 'bg-maritime-900 text-maritime-400 hover:bg-maritime-800'
                  }`}
                >
                  {fuel.fuelType.toUpperCase().replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {!compareMode && wtw && !wtwLoading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard
              label="Total WTW Emissions"
              value={`${wtw.wtwEmissionsMt.toFixed(2)} mt CO₂eq`}
              color="text-red-400"
            />
            <SummaryCard
              label="WTW Intensity"
              value={`${wtw.wtwIntensity.toFixed(2)} gCO₂eq/MJ`}
              color="text-orange-400"
            />
            <SummaryCard
              label="vs HFO"
              value={`${wtw.vsHFO > 0 ? '+' : ''}${wtw.vsHFO.toFixed(1)}%`}
              color={wtw.vsHFO < 0 ? 'text-green-400' : 'text-red-400'}
            />
            <SummaryCard
              label="vs VLSFO"
              value={`${wtw.vsVLSFO > 0 ? '+' : ''}${wtw.vsVLSFO.toFixed(1)}%`}
              color={wtw.vsVLSFO < 0 ? 'text-green-400' : 'text-red-400'}
            />
          </div>

          {/* Breakdown Chart */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Emission Breakdown</h3>
            <div className="space-y-4">
              <EmissionBar
                label="Extraction"
                value={wtw.breakdown.extraction}
                total={wtw.wtwEmissionsMt}
                color="bg-yellow-600"
              />
              <EmissionBar
                label="Refining/Processing"
                value={wtw.breakdown.refining}
                total={wtw.wtwEmissionsMt}
                color="bg-orange-600"
              />
              <EmissionBar
                label="Transport"
                value={wtw.breakdown.transport}
                total={wtw.wtwEmissionsMt}
                color="bg-blue-600"
              />
              <EmissionBar
                label="Combustion (Tank-to-Wake)"
                value={wtw.breakdown.combustion}
                total={wtw.wtwEmissionsMt}
                color="bg-red-600"
              />
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-maritime-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-maritime-400 uppercase">Metric</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-maritime-400 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-maritime-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-maritime-300">Well-to-Tank (WTT) Emissions</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono">{wtw.wttEmissionsMt.toFixed(4)} mt CO₂eq</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-maritime-300">Tank-to-Wake (TTW) Emissions</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono">{wtw.ttwEmissionsMt.toFixed(4)} mt CO₂eq</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-maritime-300">WTT Intensity</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono">{wtw.wttIntensity.toFixed(4)} gCO₂eq/MJ</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-maritime-300">TTW Intensity</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono">{wtw.ttwIntensity.toFixed(4)} gCO₂eq/MJ</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-maritime-300">Energy Content</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono">{wtw.energyContentMJ.toLocaleString()} MJ/mt</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-maritime-300">Total Energy</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-mono">{wtw.totalEnergyMJ.toLocaleString()} MJ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {compareMode && comparison && !compareLoading && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-maritime-400 text-sm mb-1">Best Fuel (Lowest Emissions)</p>
                <p className="text-2xl font-bold text-green-400">{comparison.bestFuel.toUpperCase().replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-maritime-400 text-sm mb-1">Worst Fuel (Highest Emissions)</p>
                <p className="text-2xl font-bold text-red-400">{comparison.worstFuel.toUpperCase().replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-maritime-400 text-sm mb-1">Potential Savings</p>
                <p className="text-2xl font-bold text-blue-400">{comparison.potentialSavingsPercent.toFixed(1)}%</p>
                <p className="text-sm text-maritime-400 mt-1">({comparison.potentialSavingsMt.toFixed(2)} mt CO₂eq)</p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-maritime-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-maritime-400 uppercase">Fuel Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-maritime-400 uppercase">WTW Emissions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-maritime-400 uppercase">WTW Intensity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-maritime-400 uppercase">vs HFO</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-maritime-400 uppercase">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-maritime-700">
                {comparison.fuels.map((fuel: any) => (
                  <tr key={fuel.fuelType} className={fuel.fuelType === comparison.bestFuel ? 'bg-green-900/10' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{fuel.fuelType.toUpperCase().replace(/_/g, ' ')}</span>
                        {fuel.fuelType === comparison.bestFuel && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-900/50 text-green-400 rounded">BEST</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-right font-mono">{fuel.wtwEmissionsMt.toFixed(2)} mt</td>
                    <td className="px-4 py-3 text-sm text-white text-right font-mono">{fuel.wtwIntensity.toFixed(2)} gCO₂eq/MJ</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${fuel.vsHFO < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fuel.vsHFO > 0 ? '+' : ''}{fuel.vsHFO.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <div className="w-16 h-6 bg-maritime-900 rounded flex overflow-hidden">
                          <div
                            className="bg-yellow-600"
                            style={{ width: `${(fuel.breakdown.extraction / fuel.wtwEmissionsMt) * 100}%` }}
                            title={`Extraction: ${fuel.breakdown.extraction.toFixed(2)} mt`}
                          />
                          <div
                            className="bg-orange-600"
                            style={{ width: `${(fuel.breakdown.refining / fuel.wtwEmissionsMt) * 100}%` }}
                            title={`Refining: ${fuel.breakdown.refining.toFixed(2)} mt`}
                          />
                          <div
                            className="bg-blue-600"
                            style={{ width: `${(fuel.breakdown.transport / fuel.wtwEmissionsMt) * 100}%` }}
                            title={`Transport: ${fuel.breakdown.transport.toFixed(2)} mt`}
                          />
                          <div
                            className="bg-red-600"
                            style={{ width: `${(fuel.breakdown.combustion / fuel.wtwEmissionsMt) * 100}%` }}
                            title={`Combustion: ${fuel.breakdown.combustion.toFixed(2)} mt`}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(wtwLoading || compareLoading) && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12">
          <div className="text-center text-maritime-400">Calculating emissions...</div>
        </div>
      )}
    </div>
  );
}

function EmissionBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = (value / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-maritime-300">{label}</span>
        <span className="text-sm text-white font-mono">{value.toFixed(4)} mt ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full h-6 bg-maritime-900 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
