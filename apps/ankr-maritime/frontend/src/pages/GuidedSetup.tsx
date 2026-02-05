/**
 * Guided Setup Wizard
 * Onboarding flow for new users to select modules and configure settings
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ship, Anchor, FileText, Users, TrendingUp, Package, 
  DollarSign, Map, MessageSquare, Check, ChevronRight, ChevronLeft 
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'operations' | 'chartering' | 'finance' | 'analytics';
  recommended?: boolean;
}

const MODULES: Module[] = [
  // Operations
  { id: 'vessels', name: 'Fleet Management', description: 'Track vessels, positions, and certificates', icon: <Ship className="w-6 h-6" />, category: 'operations', recommended: true },
  { id: 'voyages', name: 'Voyage Monitoring', description: 'Monitor voyages, routes, and ETAs', icon: <Map className="w-6 h-6" />, category: 'operations', recommended: true },
  { id: 'ports', name: 'Port Intelligence', description: 'Port data, congestion, tariffs', icon: <Anchor className="w-6 h-6" />, category: 'operations' },
  { id: 'da-desk', name: 'DA Desk', description: 'Disbursement account management', icon: <FileText className="w-6 h-6" />, category: 'operations' },
  
  // Chartering
  { id: 'chartering', name: 'Chartering Desk', description: 'Cargo enquiries, fixtures, C/Ps', icon: <Package className="w-6 h-6" />, category: 'chartering', recommended: true },
  { id: 'laytime', name: 'Laytime Calculator', description: 'Laytime calculations and demurrage', icon: <FileText className="w-6 h-6" />, category: 'chartering' },
  { id: 'bunkers', name: 'Bunker Management', description: 'Bunker procurement and optimization', icon: <Package className="w-6 h-6" />, category: 'chartering' },
  
  // Finance
  { id: 'invoices', name: 'Invoicing', description: 'Generate and track invoices', icon: <DollarSign className="w-6 h-6" />, category: 'finance' },
  { id: 'claims', name: 'Claims Management', description: 'Insurance and cargo claims', icon: <FileText className="w-6 h-6" />, category: 'finance' },
  
  // Analytics & AI
  { id: 'analytics', name: 'Analytics', description: 'Performance dashboards and KPIs', icon: <TrendingUp className="w-6 h-6" />, category: 'analytics' },
  { id: 'ai-assistant', name: 'AI Assistant', description: 'Mari8X AI copilot', icon: <MessageSquare className="w-6 h-6" />, category: 'analytics', recommended: true },
  { id: 'crm', name: 'CRM', description: 'Customer relationship management', icon: <Users className="w-6 h-6" />, category: 'analytics' },
];

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with Mari8X' },
  { id: 'company', title: 'Company Profile', description: 'Basic information' },
  { id: 'modules', title: 'Select Modules', description: 'Choose features' },
  { id: 'team', title: 'Invite Team', description: 'Add team members' },
  { id: 'complete', title: 'All Set!', description: 'Ready to go' },
];

export function GuidedSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'vessels', 'chartering', 'ai-assistant' // Pre-select recommended
  ]);
  const [companyData, setCompanyData] = useState({
    name: '',
    type: 'owner' as 'owner' | 'charterer' | 'broker' | 'agent',
    fleetSize: '',
  });
  const [teamEmails, setTeamEmails] = useState<string[]>(['']);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete setup
      completeSetup();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = async () => {
    // TODO: Save configuration to backend
    console.log('Setup complete:', { companyData, selectedModules, teamEmails });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-maritime-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Mari8X</h1>
          <p className="text-maritime-400">Let's set up your account in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    index < currentStep
                      ? 'bg-green-600 text-white'
                      : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-maritime-700 text-maritime-400'
                  }`}>
                    {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <p className={`text-xs mt-2 text-center ${
                    index <= currentStep ? 'text-white' : 'text-maritime-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${
                    index < currentStep ? 'bg-green-600' : 'bg-maritime-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 min-h-[500px]">
          {currentStep === 0 && <WelcomeStep />}
          {currentStep === 1 && <CompanyStep data={companyData} onChange={setCompanyData} />}
          {currentStep === 2 && <ModulesStep modules={MODULES} selected={selectedModules} onToggle={toggleModule} />}
          {currentStep === 3 && <TeamStep emails={teamEmails} onChange={setTeamEmails} />}
          {currentStep === 4 && <CompleteStep modules={MODULES.filter(m => selectedModules.includes(m.id))} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-maritime-600 cursor-not-allowed'
                : 'text-maritime-300 hover:text-white hover:bg-maritime-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center py-12">
      <Ship className="w-16 h-16 text-blue-400 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-4">Welcome aboard!</h2>
      <p className="text-maritime-400 max-w-md mx-auto mb-8">
        Mari8X is the all-in-one platform for maritime operations, chartering, and analytics.
        Let's customize it for your needs.
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        <Feature icon={<Ship />} title="Fleet Management" />
        <Feature icon={<Anchor />} title="Chartering" />
        <Feature icon={<TrendingUp />} title="Analytics" />
      </div>
    </div>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4">
      <div className="text-blue-400 mb-2">{icon}</div>
      <p className="text-sm text-white">{title}</p>
    </div>
  );
}

function CompanyStep({ data, onChange }: { data: any; onChange: (data: any) => void }) {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Tell us about your company</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-maritime-400 mb-2">Company Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="e.g., Oceanic Shipping Ltd"
            className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-maritime-400 mb-2">Company Type</label>
          <select
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
            className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="owner">Ship Owner</option>
            <option value="charterer">Charterer</option>
            <option value="broker">Broker</option>
            <option value="agent">Port Agent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-maritime-400 mb-2">Fleet Size</label>
          <select
            value={data.fleetSize}
            onChange={(e) => onChange({ ...data, fleetSize: e.target.value })}
            className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="1-5">1-5 vessels</option>
            <option value="6-20">6-20 vessels</option>
            <option value="21-50">21-50 vessels</option>
            <option value="50+">50+ vessels</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ModulesStep({ modules, selected, onToggle }: { modules: Module[]; selected: string[]; onToggle: (id: string) => void }) {
  const categories = ['operations', 'chartering', 'finance', 'analytics'] as const;
  
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose your modules</h2>
      <p className="text-maritime-400 mb-6">Select the features you need. You can always add more later.</p>
      
      {categories.map(category => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-semibold text-maritime-300 mb-3 capitalize">{category}</h3>
          <div className="grid grid-cols-2 gap-3">
            {modules.filter(m => m.category === category).map(module => (
              <button
                key={module.id}
                onClick={() => onToggle(module.id)}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  selected.includes(module.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-maritime-700 bg-maritime-900 hover:border-maritime-600'
                }`}
              >
                <div className={`flex-shrink-0 ${selected.includes(module.id) ? 'text-blue-400' : 'text-maritime-500'}`}>
                  {module.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{module.name}</p>
                    {module.recommended && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-maritime-400 text-xs mt-1">{module.description}</p>
                </div>
                {selected.includes(module.id) && (
                  <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamStep({ emails, onChange }: { emails: string[]; onChange: (emails: string[]) => void }) {
  const addEmail = () => onChange([...emails, '']);
  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    onChange(newEmails);
  };
  const removeEmail = (index: number) => onChange(emails.filter((_, i) => i !== index));

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-2">Invite your team</h2>
      <p className="text-maritime-400 mb-6">Add team members to collaborate (optional)</p>
      
      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            {emails.length > 1 && (
              <button
                onClick={() => removeEmail(index)}
                className="px-3 text-maritime-400 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      
      <button
        onClick={addEmail}
        className="mt-4 text-sm text-blue-400 hover:text-blue-300"
      >
        + Add another
      </button>
    </div>
  );
}

function CompleteStep({ modules }: { modules: Module[] }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">You're all set!</h2>
      <p className="text-maritime-400 mb-8">
        Your Mari8X account is ready with {modules.length} modules enabled.
      </p>
      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
        {modules.slice(0, 8).map(module => (
          <div key={module.id} className="bg-maritime-900 border border-maritime-700 rounded p-3">
            <div className="text-blue-400 mb-1">{module.icon}</div>
            <p className="text-xs text-maritime-300">{module.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
