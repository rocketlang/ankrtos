import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary } from '../components/Modal';

const TEMPLATES = gql`
  query Templates($category: String, $search: String) {
    documentTemplates(category: $category, search: $search) {
      id name category subCategory description version isDefault createdAt
    }
    templateCategories
  }
`;

const TEMPLATE_BY_ID = gql`
  query TemplateById($id: String!) {
    documentTemplateById(id: $id) {
      id name category content placeholders version
    }
  }
`;

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($name: String!, $category: String!, $content: String!, $description: String) {
    createDocumentTemplate(name: $name, category: $category, content: $content, description: $description) { id }
  }
`;

const RENDER = gql`
  mutation Render($id: String!, $variables: String!) {
    renderTemplate(id: $id, variables: $variables)
  }
`;

const categoryLabels: Record<string, string> = {
  charter_party: 'Charter Party',
  bill_of_lading: 'Bill of Lading',
  invoice: 'Invoice',
  pda: 'PDA',
  fixture_recap: 'Fixture Recap',
  sof: 'Statement of Facts',
  nor: 'Notice of Readiness',
  claim_letter: 'Claim Letter',
  addendum: 'Addendum',
  survey_report: 'Survey Report',
};

const categoryBadge: Record<string, string> = {
  charter_party: 'bg-blue-900/50 text-blue-400',
  bill_of_lading: 'bg-green-900/50 text-green-400',
  invoice: 'bg-orange-900/50 text-orange-400',
  pda: 'bg-yellow-900/50 text-yellow-400',
  fixture_recap: 'bg-purple-900/50 text-purple-400',
  sof: 'bg-cyan-900/50 text-cyan-400',
  nor: 'bg-teal-900/50 text-teal-400',
  claim_letter: 'bg-red-900/50 text-red-400',
  addendum: 'bg-indigo-900/50 text-indigo-400',
  survey_report: 'bg-pink-900/50 text-pink-400',
};

export function DocumentTemplates() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showRender, setShowRender] = useState(false);
  const [renderVars, setRenderVars] = useState<Record<string, string>>({});
  const [renderOutput, setRenderOutput] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '', category: 'charter_party', content: '', description: '',
  });

  const { data, loading, refetch } = useQuery(TEMPLATES, {
    variables: {
      category: filterCategory || undefined,
      search: search || undefined,
    },
  });

  const { data: detailData, loading: detailLoading } = useQuery(TEMPLATE_BY_ID, {
    variables: { id: selectedId ?? '' },
    skip: !selectedId,
  });

  const [createTemplate] = useMutation(CREATE_TEMPLATE);
  const [renderTemplate] = useMutation(RENDER);

  const templates = data?.documentTemplates ?? [];
  const categories = data?.templateCategories ?? [];
  const detail = detailData?.documentTemplateById;

  const handleCreate = async () => {
    if (!createForm.name || !createForm.content) return;
    await createTemplate({ variables: createForm });
    setShowCreate(false);
    setCreateForm({ name: '', category: 'charter_party', content: '', description: '' });
    refetch();
  };

  const handleOpenRender = () => {
    if (!detail?.placeholders) return;
    const placeholders: string[] = typeof detail.placeholders === 'string'
      ? JSON.parse(detail.placeholders)
      : detail.placeholders;
    const initial: Record<string, string> = {};
    placeholders.forEach((p: string) => { initial[p] = ''; });
    setRenderVars(initial);
    setRenderOutput(null);
    setShowRender(true);
  };

  const handleRender = async () => {
    if (!selectedId) return;
    const { data: result } = await renderTemplate({
      variables: {
        id: selectedId,
        variables: JSON.stringify(renderVars),
      },
    });
    setRenderOutput(result?.renderTemplate ?? null);
  };

  // Detail view
  if (selectedId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedId(null)} className="text-maritime-400 hover:text-white text-sm">
              &larr; Back
            </button>
            <h1 className="text-xl font-bold text-white">{detail?.name ?? 'Loading...'}</h1>
          </div>
          {detail && (
            <div className="flex gap-2">
              <span className="text-maritime-500 text-xs">v{detail.version}</span>
              <button onClick={handleOpenRender} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm">
                Render
              </button>
            </div>
          )}
        </div>

        {detailLoading && <p className="text-maritime-500 text-sm">Loading template...</p>}

        {detail && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-0.5 rounded text-xs ${categoryBadge[detail.category] ?? 'bg-maritime-700 text-maritime-300'}`}>
                {categoryLabels[detail.category] ?? detail.category}
              </span>
            </div>

            {/* Placeholders */}
            {detail.placeholders && (
              <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
                <p className="text-maritime-400 text-xs font-medium mb-2">Placeholders</p>
                <div className="flex flex-wrap gap-2">
                  {(typeof detail.placeholders === 'string' ? JSON.parse(detail.placeholders) : detail.placeholders).map((p: string) => (
                    <span key={p} className="px-2 py-0.5 rounded text-xs bg-maritime-700 text-maritime-300 font-mono">
                      {`{{${p}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="bg-maritime-800 rounded-lg border border-maritime-700 overflow-hidden">
              <div className="px-4 py-2 border-b border-maritime-700">
                <p className="text-maritime-400 text-xs font-medium">Template Content</p>
              </div>
              <pre className="p-4 bg-maritime-900 text-maritime-300 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {detail.content}
              </pre>
            </div>
          </div>
        )}

        {/* Render Modal */}
        <Modal open={showRender} onClose={() => setShowRender(false)} title="Render Template">
          <div className="space-y-1">
            {Object.keys(renderVars).map((key) => (
              <FormField key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
                <input
                  value={renderVars[key]}
                  onChange={(e) => setRenderVars({ ...renderVars, [key]: e.target.value })}
                  className={inputClass}
                  placeholder={`Enter ${key}`}
                />
              </FormField>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowRender(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
            <button onClick={handleRender} className={btnPrimary}>Render</button>
          </div>

          {renderOutput && (
            <div className="mt-4">
              <p className="text-maritime-400 text-xs font-medium mb-2">Rendered Output</p>
              <pre className="bg-maritime-900 border border-maritime-700 rounded p-4 text-maritime-300 text-xs whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {renderOutput}
              </pre>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Document Templates</h1>
          <p className="text-maritime-400 text-sm mt-1">Template library with search, preview, and render</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Add Template
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="flex-1 max-w-sm bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value="">All Categories</option>
          {(categories as string[]).map((cat: string) => (
            <option key={cat} value={cat}>{categoryLabels[cat] ?? cat}</option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      {loading && <p className="text-maritime-500 text-sm">Loading templates...</p>}

      {!loading && templates.length === 0 && (
        <div className="bg-maritime-800 rounded-lg p-8 border border-maritime-700 text-center">
          <p className="text-maritime-500 text-sm">No templates found</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t: Record<string, unknown>) => (
          <div
            key={t.id as string}
            onClick={() => setSelectedId(t.id as string)}
            className="bg-maritime-800 rounded-lg p-4 border border-maritime-700 cursor-pointer hover:border-maritime-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-white text-sm font-semibold truncate flex-1">{t.name as string}</h3>
              <span className="text-maritime-500 text-[10px] ml-2">v{t.version as number}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] ${categoryBadge[t.category as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                {categoryLabels[t.category as string] ?? (t.category as string)}
              </span>
              {t.subCategory && (
                <span className="text-maritime-500 text-[10px]">{t.subCategory as string}</span>
              )}
              {t.isDefault && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">Default</span>
              )}
            </div>
            {t.description && (
              <p className="text-maritime-400 text-xs line-clamp-2">{t.description as string}</p>
            )}
            <p className="text-maritime-600 text-[10px] mt-2">
              {new Date(t.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Template">
        <div className="space-y-1">
          <FormField label="Template Name">
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Standard Voyage Charter Party"
            />
          </FormField>
          <FormField label="Category">
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              className={selectClass}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Description">
            <input
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className={inputClass}
              placeholder="Brief description of this template"
            />
          </FormField>
          <FormField label="Content">
            <textarea
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              rows={10}
              className={`${inputClass} font-mono`}
              placeholder="Template content with {{placeholder}} variables..."
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
          <button onClick={handleCreate} className={btnPrimary}>Create Template</button>
        </div>
      </Modal>
    </div>
  );
}
