export function generateId(prefix = ''): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
}

export function removeCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, ' कोड ब्लॉक ').trim();
}

export function removeMarkdown(text: string): string {
  return text.replace(/[#*_`\[\]]/g, '').trim();
}
