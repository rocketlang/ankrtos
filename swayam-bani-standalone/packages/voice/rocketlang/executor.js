"use strict";
/**
 * RocketLang Executor for Swayam
 *
 * "Bolo Ho Jaayega" - Just say it, it happens!
 *
 * Integrates RocketLang parsing with real tool execution.
 * Supports Hindi, Tamil, Telugu + English commands.
 *
 * Features:
 * - Pronoun resolution (isko, yahan, woh file)
 * - Similar file suggestions on error
 * - "phir se" to repeat last command
 * - Extended tools: explain, test, build, diff, undo
 *
 * @author ANKR Labs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketLangExecutor = void 0;
exports.registerSwayamTools = registerSwayamTools;
exports.getRocketLangExecutor = getRocketLangExecutor;
const rocketlang_1 = require("@ankr/rocketlang");
const ankrcode_core_1 = require("@ankr/ankrcode-core");
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
// Enhanced modules
const context_js_1 = require("./context.js");
const suggestions_js_1 = require("./suggestions.js");
const tools_extended_js_1 = require("./tools-extended.js");
// ============================================================================
// RESPONSE TEMPLATES (Multilingual)
// ============================================================================
const RESPONSES = {
    file_read_success: {
        hi: 'फ़ाइल "{file}" पढ़ ली। इसमें {lines} लाइनें हैं।',
        en: 'Read file "{file}". It has {lines} lines.',
        ta: '"{file}" கோப்பு படிக்கப்பட்டது. {lines} வரிகள் உள்ளன.',
        te: '"{file}" ఫైల్ చదివాను. {lines} లైన్లు ఉన్నాయి.',
        bn: '"{file}" ফাইল পড়া হয়েছে। {lines} লাইন আছে।',
        mr: '"{file}" फाइल वाचली. {lines} ओळी आहेत.',
        gu: '"{file}" ફાઇલ વાંચી. {lines} લાઇન્સ છે.',
        kn: '"{file}" ಫೈಲ್ ಓದಿದೆ. {lines} ಸಾಲುಗಳಿವೆ.',
        ml: '"{file}" ഫയൽ വായിച്ചു. {lines} വരികൾ ഉണ്ട്.',
        pa: '"{file}" ਫਾਈਲ ਪੜ੍ਹੀ। {lines} ਲਾਈਨਾਂ ਹਨ।',
        od: '"{file}" ଫାଇଲ୍ ପଢ଼ିଲି। {lines} ଲାଇନ୍ ଅଛି।',
    },
    file_write_success: {
        hi: 'फ़ाइल "{file}" में लिख दिया।',
        en: 'Written to file "{file}".',
        ta: '"{file}" கோப்பில் எழுதப்பட்டது.',
        te: '"{file}" ఫైల్‌లో రాశాను.',
        bn: '"{file}" ফাইলে লেখা হয়েছে।',
        mr: '"{file}" फाइलमध्ये लिहिले.',
        gu: '"{file}" ફાઇલમાં લખ્યું.',
        kn: '"{file}" ಫೈಲ್‌ಗೆ ಬರೆದಿದೆ.',
        ml: '"{file}" ഫയലിൽ എഴുതി.',
        pa: '"{file}" ਫਾਈਲ ਵਿੱਚ ਲਿਖਿਆ।',
        od: '"{file}" ଫାଇଲରେ ଲେଖିଲି।',
    },
    file_not_found: {
        hi: 'फ़ाइल "{file}" नहीं मिली।',
        en: 'File "{file}" not found.',
        ta: '"{file}" கோப்பு கிடைக்கவில்லை.',
        te: '"{file}" ఫైల్ కనుగొనలేదు.',
        bn: '"{file}" ফাইল পাওয়া যায়নি।',
        mr: '"{file}" फाइल सापडली नाही.',
        gu: '"{file}" ફાઇલ મળી નહીં.',
        kn: '"{file}" ಫೈಲ್ ಸಿಗಲಿಲ್ಲ.',
        ml: '"{file}" ഫയൽ കണ്ടെത്തിയില്ല.',
        pa: '"{file}" ਫਾਈਲ ਨਹੀਂ ਮਿਲੀ।',
        od: '"{file}" ଫାଇଲ୍ ମିଳିଲା ନାହିଁ।',
    },
    git_status: {
        hi: 'Git स्टेटस: {status}',
        en: 'Git status: {status}',
        ta: 'Git நிலை: {status}',
        te: 'Git స్థితి: {status}',
        bn: 'Git স্ট্যাটাস: {status}',
        mr: 'Git स्थिती: {status}',
        gu: 'Git સ્થિતિ: {status}',
        kn: 'Git ಸ್ಥಿತಿ: {status}',
        ml: 'Git സ്ഥിതി: {status}',
        pa: 'Git ਸਥਿਤੀ: {status}',
        od: 'Git ସ୍ଥିତି: {status}',
    },
    command_success: {
        hi: 'हो गया! {result}',
        en: 'Done! {result}',
        ta: 'முடிந்தது! {result}',
        te: 'అయిపోయింది! {result}',
        bn: 'হয়ে গেছে! {result}',
        mr: 'झाले! {result}',
        gu: 'થઈ ગયું! {result}',
        kn: 'ಆಯಿತು! {result}',
        ml: 'കഴിഞ്ഞു! {result}',
        pa: 'ਹੋ ਗਿਆ! {result}',
        od: 'ହୋଇଗଲା! {result}',
    },
    command_error: {
        hi: 'माफ़ करें, कुछ गड़बड़ हुई: {error}',
        en: 'Sorry, something went wrong: {error}',
        ta: 'மன்னிக்கவும், ஏதோ தவறு: {error}',
        te: 'క్షమించండి, ఏదో తప్పు: {error}',
        bn: 'দুঃখিত, কিছু ভুল হয়েছে: {error}',
        mr: 'माफ करा, काहीतरी चूक झाली: {error}',
        gu: 'માફ કરશો, કંઈક ખોટું થયું: {error}',
        kn: 'ಕ್ಷಮಿಸಿ, ಏನೋ ತಪ್ಪಾಯಿತು: {error}',
        ml: 'ക്ഷമിക്കണം, എന്തോ തെറ്റ് പറ്റി: {error}',
        pa: 'ਮੁਆਫ਼ ਕਰਨਾ, ਕੁਝ ਗਲਤ ਹੋਇਆ: {error}',
        od: 'କ୍ଷମା କରନ୍ତୁ, କିଛି ଭୁଲ ହେଲା: {error}',
    },
    not_understood: {
        hi: 'समझ नहीं आया। क्या आप दोबारा बोल सकते हैं?',
        en: "I didn't understand. Could you say that again?",
        ta: 'புரியவில்லை. மீண்டும் சொல்ல முடியுமா?',
        te: 'అర్థం కాలేదు. మళ్ళీ చెప్పగలరా?',
        bn: 'বুঝলাম না। আবার বলবেন?',
        mr: 'समजले नाही. पुन्हा सांगाल का?',
        gu: 'સમજાયું નહીં. ફરીથી કહેશો?',
        kn: 'ಅರ್ಥವಾಗಲಿಲ್ಲ. ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ?',
        ml: 'മനസ്സിലായില്ല. വീണ്ടും പറയാമോ?',
        pa: 'ਸਮਝ ਨਹੀਂ ਆਇਆ। ਦੁਬਾਰਾ ਦੱਸੋਗੇ?',
        od: 'ବୁଝିଲି ନାହିଁ। ପୁଣି କହିବେ?',
    },
    list_files: {
        hi: 'फ़ोल्डर में {count} फ़ाइलें हैं: {files}',
        en: 'Folder has {count} files: {files}',
        ta: 'கோப்புறையில் {count} கோப்புகள்: {files}',
        te: 'ఫోల్డర్‌లో {count} ఫైళ్లు: {files}',
        bn: 'ফোল্ডারে {count} ফাইল আছে: {files}',
        mr: 'फोल्डरमध्ये {count} फाइल्स आहेत: {files}',
        gu: 'ફોલ્ડરમાં {count} ફાઇલ્સ છે: {files}',
        kn: 'ಫೋಲ್ಡರ್‌ನಲ್ಲಿ {count} ಫೈಲ್‌ಗಳಿವೆ: {files}',
        ml: 'ഫോൾഡറിൽ {count} ഫയലുകൾ: {files}',
        pa: 'ਫੋਲਡਰ ਵਿੱਚ {count} ਫਾਈਲਾਂ ਹਨ: {files}',
        od: 'ଫୋଲ୍ଡରରେ {count} ଫାଇଲ୍ ଅଛି: {files}',
    },
};
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatResponse(template, language, vars) {
    const langTemplates = RESPONSES[template];
    if (!langTemplates)
        return String(vars.result || vars.error || '');
    let text = langTemplates[language] || langTemplates.en;
    for (const [key, value] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return text;
}
function truncateForSpeech(text, maxLength = 300) {
    // Remove code blocks for speech
    let cleaned = text.replace(/```[\s\S]*?```/g, '');
    // Remove markdown
    cleaned = cleaned.replace(/[*_`#]/g, '');
    // Truncate
    if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength) + '...';
    }
    return cleaned.trim();
}
// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================
/**
 * Register real tool implementations
 */
function registerSwayamTools() {
    // File Read Tool
    const readTool = {
        name: 'read',
        description: 'Read a file (पढ़ो/padho/படி/చదువు)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File path to read' },
            },
            required: ['path'],
        },
        handler: async (params) => {
            const filePath = (0, path_1.resolve)(String(params.path));
            if (!(0, fs_1.existsSync)(filePath)) {
                return { success: false, error: `File not found: ${params.path}` };
            }
            try {
                const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                const lines = content.split('\n').length;
                return {
                    success: true,
                    output: content,
                    metadata: { lines, path: filePath },
                };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(readTool);
    // File Write Tool
    const writeTool = {
        name: 'write',
        description: 'Write to a file (लिखो/likho/எழுது/రాయి)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'Content to write' },
            },
            required: ['path', 'content'],
        },
        handler: async (params) => {
            const filePath = (0, path_1.resolve)(String(params.path));
            try {
                const dir = (0, path_1.dirname)(filePath);
                if (!(0, fs_1.existsSync)(dir)) {
                    (0, fs_1.mkdirSync)(dir, { recursive: true });
                }
                (0, fs_1.writeFileSync)(filePath, String(params.content));
                return { success: true, output: `Written to ${params.path}` };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(writeTool);
    // List Directory Tool
    const listTool = {
        name: 'list',
        description: 'List files in directory (देखो/dekho/ls)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory path', default: '.' },
            },
        },
        handler: async (params) => {
            const dirPath = (0, path_1.resolve)(String(params.path || '.'));
            if (!(0, fs_1.existsSync)(dirPath)) {
                return { success: false, error: `Directory not found: ${params.path}` };
            }
            try {
                const files = (0, fs_1.readdirSync)(dirPath);
                const fileList = files.map(f => {
                    const stat = (0, fs_1.statSync)((0, path_1.join)(dirPath, f));
                    return { name: f, isDirectory: stat.isDirectory(), size: stat.size };
                });
                return {
                    success: true,
                    output: files.join(', '),
                    data: fileList,
                };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(listTool);
    // Git Status Tool
    const gitStatusTool = {
        name: 'git_status',
        description: 'Get git status (गिट स्टेटस)',
        parameters: {
            type: 'object',
            properties: {},
        },
        handler: async () => {
            try {
                const output = (0, child_process_1.execSync)('git status --short', { encoding: 'utf-8', timeout: 5000 });
                const clean = output.trim() === '';
                return {
                    success: true,
                    output: clean ? 'Clean - no changes' : output,
                    data: { clean, changes: output.split('\n').filter(Boolean) },
                };
            }
            catch {
                return { success: false, error: 'Not a git repository or git not available' };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(gitStatusTool);
    // Git Commit Tool
    const commitTool = {
        name: 'commit',
        description: 'Create a git commit (कमिट)',
        parameters: {
            type: 'object',
            properties: {
                message: { type: 'string', description: 'Commit message' },
            },
            required: ['message'],
        },
        handler: async (params) => {
            try {
                (0, child_process_1.execSync)('git add .', { encoding: 'utf-8', timeout: 5000 });
                const output = (0, child_process_1.execSync)(`git commit -m "${params.message}"`, { encoding: 'utf-8', timeout: 10000 });
                return { success: true, output };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(commitTool);
    // Search/Grep Tool
    const searchTool = {
        name: 'search',
        description: 'Search for text in files (खोजो/khojo/தேடு/వెతుకు)',
        parameters: {
            type: 'object',
            properties: {
                pattern: { type: 'string', description: 'Search pattern' },
                path: { type: 'string', description: 'Search path', default: '.' },
            },
            required: ['pattern'],
        },
        handler: async (params) => {
            try {
                const output = (0, child_process_1.execSync)(`grep -r "${params.pattern}" ${params.path || '.'} --include="*.ts" --include="*.js" --include="*.json" -l 2>/dev/null | head -20`, { encoding: 'utf-8', timeout: 10000 });
                const files = output.trim().split('\n').filter(Boolean);
                return {
                    success: true,
                    output: files.length ? `Found in ${files.length} files` : 'No matches found',
                    data: files,
                };
            }
            catch {
                return { success: true, output: 'No matches found', data: [] };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(searchTool);
    // Run Shell Command Tool
    const runTool = {
        name: 'run',
        description: 'Run a shell command (चलाओ/chalao/$)',
        parameters: {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'Shell command to run' },
            },
            required: ['command'],
        },
        handler: async (params) => {
            const cmd = String(params.command);
            // Safety: Block dangerous commands
            const blocked = ['rm -rf', 'mkfs', 'dd if=', ':(){', 'fork bomb', '> /dev/sd'];
            if (blocked.some(b => cmd.includes(b))) {
                return { success: false, error: 'Command blocked for safety' };
            }
            try {
                const output = (0, child_process_1.execSync)(cmd, { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 1024 });
                return { success: true, output: output.substring(0, 5000) };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(runTool);
    // NPM Install Tool
    const npmInstallTool = {
        name: 'npm_install',
        description: 'Install npm packages (pnpm add/install)',
        parameters: {
            type: 'object',
            properties: {
                package: { type: 'string', description: 'Package name to install (optional)' },
            },
        },
        handler: async (params) => {
            try {
                const cmd = params.package ? `pnpm add ${params.package}` : 'pnpm install';
                (0, child_process_1.execSync)(cmd, { encoding: 'utf-8', timeout: 60000 });
                return { success: true, output: `Installed: ${params.package || 'all dependencies'}` };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(npmInstallTool);
    // Create/Touch File Tool
    const createTool = {
        name: 'create',
        description: 'Create a new file (बनाओ/banao/touch)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File path to create' },
                content: { type: 'string', description: 'Initial content', default: '' },
            },
            required: ['path'],
        },
        handler: async (params) => {
            const filePath = (0, path_1.resolve)(String(params.path));
            try {
                const dir = (0, path_1.dirname)(filePath);
                if (!(0, fs_1.existsSync)(dir)) {
                    (0, fs_1.mkdirSync)(dir, { recursive: true });
                }
                (0, fs_1.writeFileSync)(filePath, String(params.content || ''));
                return { success: true, output: `Created: ${params.path}` };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        },
    };
    (0, ankrcode_core_1.registerTool)(createTool);
    console.log('🚀 RocketLang tools registered for Swayam');
}
// ============================================================================
// MAIN EXECUTOR CLASS
// ============================================================================
class RocketLangExecutor {
    workingDirectory;
    initialized = false;
    contextManager = (0, context_js_1.getContextManager)();
    constructor(workingDirectory = process.cwd()) {
        this.workingDirectory = workingDirectory;
    }
    /**
     * Initialize executor and register tools
     */
    initialize() {
        if (this.initialized)
            return;
        registerSwayamTools();
        (0, tools_extended_js_1.registerExtendedTools)(); // New tools: explain, test, build, diff, undo
        this.initialized = true;
    }
    /**
     * Try to execute text as a RocketLang command
     * Returns null if not a recognizable command
     *
     * Enhanced features:
     * - Pronoun resolution (isko → last file)
     * - "phir se" repeat last command
     * - Suggestions on error
     */
    async tryExecute(text, language = 'hi', userId) {
        const startTime = Date.now();
        // =========================================================================
        // 1. CHECK FOR "PHIR SE" (REPEAT LAST COMMAND)
        // =========================================================================
        if (this.contextManager.isRepeatCommand(text)) {
            const lastCmd = this.contextManager.getLastCommand(userId);
            if (!lastCmd) {
                return {
                    success: false,
                    isCommand: true,
                    command: text,
                    error: language === 'hi'
                        ? 'पिछला कोई command नहीं है'
                        : 'No previous command to repeat',
                    executionTime: Date.now() - startTime,
                    wasRepeat: true,
                };
            }
            // Execute the last command again
            console.log(`🔄 RocketLang: Repeating last command: "${lastCmd.text}"`);
            const repeatResult = await this.tryExecute(lastCmd.text, language, userId);
            if (repeatResult) {
                repeatResult.wasRepeat = true;
            }
            return repeatResult;
        }
        // =========================================================================
        // 2. RESOLVE PRONOUNS (isko → last file, yahan → current dir)
        // =========================================================================
        const resolved = this.contextManager.resolvePronouns(text, userId);
        const textToExecute = resolved.resolved;
        if (resolved.substitutions.length > 0) {
            console.log(`📝 RocketLang: Pronoun resolution: "${text}" → "${textToExecute}"`);
            console.log(`   Substitutions:`, resolved.substitutions);
        }
        // =========================================================================
        // 3. PARSE WITH ROCKETLANG
        // =========================================================================
        const parseResult = (0, rocketlang_1.parse)(textToExecute);
        // Check if it's a valid command
        if (parseResult.errors.length > 0 || parseResult.commands.length === 0) {
            // Not a command - let AI handle it
            return null;
        }
        const cmd = parseResult.commands[0];
        console.log(`🚀 RocketLang: Executing "${cmd.tool}" with params:`, cmd.parameters);
        // =========================================================================
        // 4. EXECUTE THE COMMAND
        // =========================================================================
        try {
            // Execute via AnkrCode
            const result = await (0, ankrcode_core_1.executeTool)(cmd.tool, cmd.parameters);
            // =========================================================================
            // 5. UPDATE CONTEXT (for future pronoun resolution)
            // =========================================================================
            this.contextManager.updateContext(userId, {
                command: text,
                tool: cmd.tool,
                file: cmd.parameters?.path,
                directory: cmd.parameters?.directory,
                output: result.output,
                error: result.error,
            });
            // Track file operations for undo
            if (cmd.tool === 'write' || cmd.tool === 'create') {
                const filePath = (0, path_1.resolve)(String(cmd.parameters?.path));
                const previousContent = (0, fs_1.existsSync)(filePath) ? (0, fs_1.readFileSync)(filePath, 'utf-8') : undefined;
                (0, tools_extended_js_1.pushUndoAction)({
                    type: cmd.tool === 'create' ? 'create' : 'write',
                    path: filePath,
                    previousContent,
                    timestamp: Date.now(),
                    description: `${cmd.tool} ${cmd.parameters?.path}`,
                });
            }
            // =========================================================================
            // 6. HANDLE ERRORS WITH SUGGESTIONS
            // =========================================================================
            if (!result.success && result.error) {
                const suggestionResult = (0, suggestions_js_1.suggestForError)(result.error, { tool: cmd.tool, params: cmd.parameters });
                return {
                    success: false,
                    isCommand: true,
                    command: text,
                    resolvedCommand: textToExecute !== text ? textToExecute : undefined,
                    tool: cmd.tool,
                    output: result.output,
                    error: language === 'hi' ? suggestionResult.messageHindi : suggestionResult.message,
                    suggestions: suggestionResult.suggestions.map(s => ({
                        type: s.type,
                        value: s.value,
                        confidence: s.confidence,
                    })),
                    executionTime: Date.now() - startTime,
                };
            }
            return {
                success: result.success,
                isCommand: true,
                command: text,
                resolvedCommand: textToExecute !== text ? textToExecute : undefined,
                tool: cmd.tool,
                output: result.output,
                data: result.data,
                error: result.error,
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            const errorMsg = error.message;
            const suggestionResult = (0, suggestions_js_1.suggestForError)(errorMsg, { tool: cmd.tool, params: cmd.parameters });
            return {
                success: false,
                isCommand: true,
                command: text,
                resolvedCommand: textToExecute !== text ? textToExecute : undefined,
                tool: cmd.tool,
                error: language === 'hi' ? suggestionResult.messageHindi : suggestionResult.message,
                suggestions: suggestionResult.suggestions.map(s => ({
                    type: s.type,
                    value: s.value,
                    confidence: s.confidence,
                })),
                executionTime: Date.now() - startTime,
            };
        }
    }
    /**
     * Format execution result for response
     */
    formatResult(result, language) {
        // Handle errors with suggestions
        if (!result.success) {
            let errorText = formatResponse('command_error', language, { error: result.error || 'Unknown error' });
            // Add suggestions if available
            if (result.suggestions && result.suggestions.length > 0) {
                const suggestionList = result.suggestions
                    .slice(0, 3)
                    .map((s, i) => `${i + 1}. ${(0, path_1.basename)(s.value)}`)
                    .join(', ');
                const suggestionIntro = language === 'hi' ? 'शायद इनमें से कोई?' : 'Did you mean?';
                errorText += `\n${suggestionIntro} ${suggestionList}`;
            }
            return {
                text: errorText,
                speakText: truncateForSpeech(errorText),
            };
        }
        // Handle repeat command
        if (result.wasRepeat) {
            const repeatPrefix = language === 'hi' ? 'फिर से: ' : 'Repeated: ';
            const formatted = this.formatToolResult(result, language);
            return {
                text: repeatPrefix + formatted.text,
                speakText: repeatPrefix + formatted.speakText,
                data: formatted.data,
            };
        }
        return this.formatToolResult(result, language);
    }
    /**
     * Format result based on tool type
     */
    formatToolResult(result, language) {
        // Format based on tool
        switch (result.tool) {
            case 'read':
            case 'padho':
                const metadata = result.data;
                const readText = formatResponse('file_read_success', language, {
                    file: (0, path_1.basename)(String(metadata?.path || 'file')),
                    lines: metadata?.lines || 0,
                });
                return {
                    text: readText + '\n\n```\n' + (result.output || '').substring(0, 1000) + '\n```',
                    speakText: readText,
                    data: result.data,
                };
            case 'write':
            case 'likho':
                const writeText = formatResponse('file_write_success', language, { file: 'file' });
                return { text: writeText, speakText: writeText };
            case 'list':
            case 'ls':
            case 'dekho':
                const files = result.data;
                const listText = formatResponse('list_files', language, {
                    count: files?.length || 0,
                    files: files?.slice(0, 10).map(f => f.name).join(', ') || '',
                });
                return { text: listText, speakText: listText, data: result.data };
            case 'git_status':
                const statusText = formatResponse('git_status', language, {
                    status: result.output || 'unknown',
                });
                return { text: statusText, speakText: truncateForSpeech(statusText) };
            case 'search':
            case 'khojo':
                const searchFiles = result.data;
                const searchText = searchFiles?.length
                    ? `${searchFiles.length} files mein mila: ${searchFiles.slice(0, 5).join(', ')}`
                    : 'Kuch nahi mila';
                return { text: searchText, speakText: searchText };
            // New tools
            case 'explain':
            case 'samjhao':
                return {
                    text: result.output || '',
                    speakText: truncateForSpeech(result.output || ''),
                };
            case 'test':
                const testData = result.data;
                const testStatus = testData?.passed
                    ? (language === 'hi' ? '✅ सब टेस्ट पास!' : '✅ All tests passed!')
                    : (language === 'hi' ? '❌ कुछ टेस्ट फेल हुए' : '❌ Some tests failed');
                return {
                    text: testStatus + '\n' + (result.output || '').substring(0, 500),
                    speakText: testStatus,
                };
            case 'build':
                const buildStatus = language === 'hi' ? '✅ बिल्ड हो गया!' : '✅ Build completed!';
                return {
                    text: buildStatus + '\n' + (result.output || ''),
                    speakText: buildStatus,
                };
            case 'diff':
                const diffData = result.data;
                const diffStatus = diffData?.hasChanges
                    ? (language === 'hi'
                        ? `${diffData.additions || 0} additions, ${diffData.deletions || 0} deletions`
                        : `${diffData.additions || 0} additions, ${diffData.deletions || 0} deletions`)
                    : (language === 'hi' ? 'कोई फर्क नहीं' : 'No changes');
                return {
                    text: diffStatus + '\n' + (result.output || '').substring(0, 1000),
                    speakText: diffStatus,
                };
            case 'undo':
                const undoText = language === 'hi' ? '↩️ वापस कर दिया' : '↩️ Undone';
                return {
                    text: undoText + ': ' + (result.output || ''),
                    speakText: undoText,
                };
            case 'history':
                const historyText = language === 'hi' ? '📜 Command इतिहास' : '📜 Command history';
                return {
                    text: historyText + ':\n' + (result.output || ''),
                    speakText: historyText,
                };
            case 'repeat':
                // This shouldn't be reached as repeat triggers re-execution
                return {
                    text: result.output || '',
                    speakText: truncateForSpeech(result.output || ''),
                };
            default:
                const defaultText = formatResponse('command_success', language, {
                    result: truncateForSpeech(result.output || 'Done'),
                });
                return {
                    text: result.output || defaultText,
                    speakText: truncateForSpeech(defaultText),
                };
        }
    }
    /**
     * Check if text looks like a command (quick heuristic)
     */
    looksLikeCommand(text) {
        const commandPatterns = [
            // Hindi commands
            /^(पढ़ो|लिखो|बनाओ|देखो|खोजो|चलाओ|हटाओ|समझाओ|टेस्ट|बिल्ड|वापस)/i,
            /^(padho|likho|banao|dekho|khojo|chalao|hatao|samjhao|test|build|undo)/i,
            // English commands
            /^(read|write|create|list|search|run|git|npm|show|open|edit|delete|explain|test|build|diff|undo|history)/i,
            // Repeat commands (phir se)
            /^(phir se|फिर से|dobara|दोबारा|repeat|again|wahi karo|वही करो)$/i,
            // Pronoun-based commands (isko padho, yahan dekho)
            /^(isko|इसको|isme|इसमें|yahan|यहां)/i,
            // File paths
            /\.(ts|js|json|txt|md|py|go|rs)$/i,
            // Git
            /^git\s/i,
            // Shell
            /^\$/,
        ];
        return commandPatterns.some(p => p.test(text.trim()));
    }
    /**
     * Get command history
     */
    getHistory(userId, limit = 10) {
        return this.contextManager.getCommandHistory(userId, limit);
    }
    /**
     * Get recent files
     */
    getRecentFiles(userId) {
        return this.contextManager.getRecentFiles(userId);
    }
}
exports.RocketLangExecutor = RocketLangExecutor;
// ============================================================================
// SINGLETON EXPORT
// ============================================================================
let executor = null;
function getRocketLangExecutor(workingDirectory) {
    if (!executor) {
        executor = new RocketLangExecutor(workingDirectory);
        executor.initialize();
    }
    return executor;
}
exports.default = {
    RocketLangExecutor,
    getRocketLangExecutor,
    registerSwayamTools,
};
//# sourceMappingURL=executor.js.map