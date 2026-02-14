/**
 * SWAYAM TODO Planner
 * Generates structured task lists from intent and entities
 */

import type {
  Intent,
  ExtractedEntities,
  TodoItem,
  TodoPlan,
  AgentType,
  Message
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN TEMPLATES - Pre-defined task sequences for common intents
// ═══════════════════════════════════════════════════════════════════════════════

interface PlanTemplate {
  intent: string;
  title: string;
  titleHi: string;
  tasks: Omit<TodoItem, 'id' | 'status' | 'startedAt' | 'completedAt'>[];
}

const PLAN_TEMPLATES: PlanTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // GST SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'gst_setup',
    title: 'GST Registration Setup',
    titleHi: 'GST रजिस्ट्रेशन सेटअप',
    tasks: [
      {
        title: 'Verify company details on MCA',
        titleHi: 'MCA पर कंपनी details verify करें',
        priority: 1,
        agent: 'compliance',
        tools: ['mca_company_search', 'mca_cin_lookup'],
        dependencies: []
      },
      {
        title: 'Verify PAN card',
        titleHi: 'PAN card verify करें',
        priority: 1,
        agent: 'compliance',
        tools: ['pan_verify'],
        dependencies: []
      },
      {
        title: 'Check existing GSTIN (if any)',
        titleHi: 'पहले से कोई GSTIN है या नहीं check करें',
        priority: 2,
        agent: 'compliance',
        tools: ['gst_search_pan'],
        dependencies: ['task_2']
      },
      {
        title: 'Prepare registration documents',
        titleHi: 'Registration documents तैयार करें',
        description: 'PAN, Aadhaar, Address proof, Bank statement, Photos',
        priority: 2,
        agent: 'document',
        tools: ['digilocker_fetch'],
        dependencies: ['task_1', 'task_2']
      },
      {
        title: 'Apply for GSTIN',
        titleHi: 'GSTIN के लिए apply करें',
        priority: 3,
        agent: 'compliance',
        tools: [],
        dependencies: ['task_3', 'task_4'],
        metadata: { requiresUserAction: true }
      },
      {
        title: 'Setup E-Way bill access',
        titleHi: 'E-Way bill access setup करें',
        priority: 4,
        agent: 'compliance',
        tools: ['eway_generate'],
        dependencies: ['task_5']
      },
      {
        title: 'Train on GSTR-1/3B filing',
        titleHi: 'GSTR-1/3B filing सिखाएं',
        priority: 5,
        agent: 'training',
        tools: [],
        dependencies: ['task_5']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GST RETURN FILING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'gst_return_file',
    title: 'GST Return Filing',
    titleHi: 'GST Return Filing',
    tasks: [
      {
        title: 'Fetch GSTR-2A/2B data',
        titleHi: 'GSTR-2A/2B data लाएं',
        priority: 1,
        agent: 'compliance',
        tools: ['gstr2a_fetch', 'gstr2b_fetch'],
        dependencies: []
      },
      {
        title: 'Reconcile purchase invoices',
        titleHi: 'Purchase invoices reconcile करें',
        priority: 2,
        agent: 'compliance',
        tools: ['itc_check'],
        dependencies: ['task_1']
      },
      {
        title: 'Prepare GSTR-1',
        titleHi: 'GSTR-1 तैयार करें',
        priority: 2,
        agent: 'compliance',
        tools: ['gstr1_prepare'],
        dependencies: []
      },
      {
        title: 'Review and file GSTR-1',
        titleHi: 'GSTR-1 review और file करें',
        priority: 3,
        agent: 'compliance',
        tools: ['gstr1_file'],
        dependencies: ['task_3'],
        metadata: { requiresUserAction: true }
      },
      {
        title: 'Prepare GSTR-3B',
        titleHi: 'GSTR-3B तैयार करें',
        priority: 3,
        agent: 'compliance',
        tools: ['gstr3b_prepare'],
        dependencies: ['task_2']
      },
      {
        title: 'Review and file GSTR-3B',
        titleHi: 'GSTR-3B review और file करें',
        priority: 4,
        agent: 'compliance',
        tools: ['gstr3b_file'],
        dependencies: ['task_4', 'task_5'],
        metadata: { requiresUserAction: true }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE CREATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'invoice_create',
    title: 'Create Invoice',
    titleHi: 'Invoice बनाएं',
    tasks: [
      {
        title: 'Verify customer GSTIN',
        titleHi: 'Customer का GSTIN verify करें',
        priority: 1,
        agent: 'compliance',
        tools: ['gst_verify'],
        dependencies: []
      },
      {
        title: 'Check product HSN codes',
        titleHi: 'Products के HSN codes check करें',
        priority: 1,
        agent: 'compliance',
        tools: ['hsn_lookup', 'gst_rate'],
        dependencies: []
      },
      {
        title: 'Calculate GST',
        titleHi: 'GST calculate करें',
        priority: 2,
        agent: 'compliance',
        tools: ['gst_calc'],
        dependencies: ['task_2']
      },
      {
        title: 'Generate invoice',
        titleHi: 'Invoice generate करें',
        priority: 3,
        agent: 'general',
        tools: ['invoice_create'],
        dependencies: ['task_1', 'task_3']
      },
      {
        title: 'Generate E-Invoice (if applicable)',
        titleHi: 'E-Invoice generate करें (अगर लागू हो)',
        priority: 4,
        agent: 'compliance',
        tools: ['einvoice_generate'],
        dependencies: ['task_4']
      },
      {
        title: 'Generate E-Way bill (if applicable)',
        titleHi: 'E-Way bill generate करें (अगर लागू हो)',
        priority: 4,
        agent: 'compliance',
        tools: ['eway_generate'],
        dependencies: ['task_4']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAD MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'lead_create',
    title: 'Create New Lead',
    titleHi: 'नई Lead बनाएं',
    tasks: [
      {
        title: 'Capture lead information',
        titleHi: 'Lead की जानकारी collect करें',
        priority: 1,
        agent: 'general',
        tools: [],
        dependencies: []
      },
      {
        title: 'Verify contact details',
        titleHi: 'Contact details verify करें',
        priority: 2,
        agent: 'general',
        tools: [],
        dependencies: ['task_1']
      },
      {
        title: 'Create lead in CRM',
        titleHi: 'CRM में lead बनाएं',
        priority: 3,
        agent: 'general',
        tools: ['lead_create'],
        dependencies: ['task_2']
      },
      {
        title: 'Assign to sales rep',
        titleHi: 'Sales rep को assign करें',
        priority: 4,
        agent: 'general',
        tools: ['lead_assign'],
        dependencies: ['task_3']
      },
      {
        title: 'Schedule follow-up',
        titleHi: 'Follow-up schedule करें',
        priority: 4,
        agent: 'general',
        tools: ['activity_task'],
        dependencies: ['task_3']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VEHICLE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    intent: 'vehicle_track',
    title: 'Track Vehicle',
    titleHi: 'Vehicle Track करें',
    tasks: [
      {
        title: 'Get vehicle current position',
        titleHi: 'Vehicle की current position लाएं',
        priority: 1,
        agent: 'general',
        tools: ['vehicle_position', 'ulip_gps_track'],
        dependencies: []
      },
      {
        title: 'Get vehicle details',
        titleHi: 'Vehicle details लाएं',
        priority: 1,
        agent: 'compliance',
        tools: ['ulip_vahan_rc'],
        dependencies: []
      },
      {
        title: 'Check FASTag balance',
        titleHi: 'FASTag balance check करें',
        priority: 2,
        agent: 'general',
        tools: ['ulip_fastag_balance'],
        dependencies: []
      },
      {
        title: 'Show on map',
        titleHi: 'Map पर दिखाएं',
        priority: 2,
        agent: 'general',
        tools: [],
        dependencies: ['task_1']
      }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TODO PLANNER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TodoPlanner {
  private templates: PlanTemplate[] = PLAN_TEMPLATES;
  private aiProxyUrl: string;

  constructor(config?: { aiProxyUrl?: string }) {
    this.aiProxyUrl = config?.aiProxyUrl || process.env.AI_PROXY_URL || 'http://localhost:4444';
  }

  /**
   * Create a plan from intent and entities
   */
  async createPlan(
    intent: Intent,
    entities: ExtractedEntities,
    context?: Message[]
  ): Promise<TodoPlan> {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 1. Try to find a matching template
    const template = this.findTemplate(intent.primary);

    let tasks: TodoItem[];
    let title: string;
    let titleHi: string;

    if (template) {
      // Use template
      tasks = this.instantiateTemplate(template, entities);
      title = template.title;
      titleHi = template.titleHi;
    } else {
      // Generate plan with AI
      const generated = await this.generatePlanWithAI(intent, entities, context);
      tasks = generated.tasks;
      title = generated.title;
      titleHi = generated.titleHi;
    }

    // Assign IDs to tasks
    tasks = tasks.map((task, index) => ({
      ...task,
      id: `task_${index + 1}`,
      status: 'pending' as const
    }));

    // Update dependencies to use actual IDs
    tasks = this.resolveDependencies(tasks);

    return {
      id: planId,
      title,
      titleHi,
      intent,
      entities,
      items: tasks,
      status: 'ready',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Find a template for the intent
   */
  private findTemplate(intentName: string): PlanTemplate | undefined {
    return this.templates.find(t => t.intent === intentName);
  }

  /**
   * Instantiate a template with entities
   */
  private instantiateTemplate(template: PlanTemplate, entities: ExtractedEntities): TodoItem[] {
    return template.tasks.map((task, index) => {
      // Replace placeholders in title with entity values
      let title = task.title;
      let titleHi = task.titleHi;

      for (const [key, entity] of Object.entries(entities)) {
        const value = Array.isArray(entity) ? entity[0]?.value : entity?.value;
        if (value) {
          title = title.replace(`{${key}}`, value);
          titleHi = titleHi.replace(`{${key}}`, value);
        }
      }

      return {
        ...task,
        id: `task_${index + 1}`,
        title,
        titleHi,
        status: 'pending' as const
      };
    });
  }

  /**
   * Generate plan using AI
   */
  private async generatePlanWithAI(
    intent: Intent,
    entities: ExtractedEntities,
    context?: Message[]
  ): Promise<{ title: string; titleHi: string; tasks: TodoItem[] }> {
    try {
      const systemPrompt = `You are a task planner for SWAYAM, an Indian business AI assistant.
Generate a detailed TODO list for the given intent.

Available MCP tools (use these in tasks):
- Compliance: gst_verify, gst_calc, hsn_lookup, tds_calc, income_tax_calc, pan_verify, eway_generate, einvoice_generate
- ERP: invoice_create, stock_check, po_create, so_create, balance_sheet
- CRM: lead_create, lead_assign, contact_create, opportunity_create, activity_task
- Banking: upi_send, emi_calc, bank_balance, bbps_electricity
- Government: aadhaar_verify, epf_balance, pm_kisan, ulip_vahan_rc
- Logistics: vehicle_position, container_track, toll_estimate, distance_calc

Return JSON:
{
  "title": "English title",
  "titleHi": "Hindi title",
  "tasks": [
    {
      "title": "Task in English",
      "titleHi": "Task in Hindi",
      "priority": 1-5,
      "agent": "compliance|document|coding|research|general|training",
      "tools": ["tool_name"],
      "dependencies": ["task_1"] // or empty []
    }
  ]
}`;

      const response = await fetch(`${this.aiProxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'auto',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(context || []).slice(-3),
            {
              role: 'user',
              content: `Create a TODO plan for:
Intent: ${intent.primary} (${intent.domain})
Entities: ${JSON.stringify(entities)}
Confidence: ${intent.confidence}`
            }
          ],
          temperature: 0.2
        })
      });

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content || '{}';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || `Plan for ${intent.primary}`,
          titleHi: parsed.titleHi || `${intent.primary} के लिए Plan`,
          tasks: (parsed.tasks || []).map((t: any, i: number) => ({
            id: `task_${i + 1}`,
            title: t.title || `Task ${i + 1}`,
            titleHi: t.titleHi || `Task ${i + 1}`,
            status: 'pending' as const,
            priority: t.priority || 3,
            agent: t.agent || 'general',
            tools: t.tools || [],
            dependencies: t.dependencies || []
          }))
        };
      }
    } catch (error) {
      console.error('AI plan generation error:', error);
    }

    // Fallback: simple single-task plan
    return {
      title: `Execute ${intent.primary}`,
      titleHi: `${intent.primary} करें`,
      tasks: [{
        id: 'task_1',
        title: `Complete ${intent.primary}`,
        titleHi: `${intent.primary} पूरा करें`,
        status: 'pending',
        priority: 1,
        agent: 'general',
        tools: [],
        dependencies: []
      }]
    };
  }

  /**
   * Resolve task dependencies
   */
  private resolveDependencies(tasks: TodoItem[]): TodoItem[] {
    const taskIds = new Set(tasks.map(t => t.id));

    return tasks.map(task => ({
      ...task,
      dependencies: task.dependencies.filter(dep => taskIds.has(dep))
    }));
  }

  /**
   * Get next executable tasks (no pending dependencies)
   */
  getExecutableTasks(plan: TodoPlan): TodoItem[] {
    const completedTasks = new Set(
      plan.items.filter(t => t.status === 'completed').map(t => t.id)
    );

    return plan.items.filter(task =>
      task.status === 'pending' &&
      task.dependencies.every(dep => completedTasks.has(dep))
    );
  }

  /**
   * Update task status
   */
  updateTaskStatus(
    plan: TodoPlan,
    taskId: string,
    status: TodoItem['status'],
    result?: any
  ): TodoPlan {
    const updatedItems = plan.items.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status,
          result,
          startedAt: status === 'in_progress' ? new Date() : task.startedAt,
          completedAt: status === 'completed' ? new Date() : task.completedAt
        };
      }
      return task;
    });

    const completed = updatedItems.filter(t => t.status === 'completed').length;
    const progress = Math.round((completed / updatedItems.length) * 100);

    const allCompleted = updatedItems.every(t => t.status === 'completed');
    const anyFailed = updatedItems.some(t => t.status === 'blocked');

    return {
      ...plan,
      items: updatedItems,
      progress,
      status: allCompleted ? 'completed' : anyFailed ? 'failed' : 'executing',
      updatedAt: new Date()
    };
  }

  /**
   * Add a new template
   */
  addTemplate(template: PlanTemplate): void {
    this.templates.push(template);
  }

  /**
   * Get all templates
   */
  getTemplates(): PlanTemplate[] {
    return this.templates;
  }
}

// Export singleton instance
export const todoPlanner = new TodoPlanner();
