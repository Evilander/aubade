import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { buildPrompt } from './prompt.js';
import { validateScript, summarizeProblems } from './rubric.js';

const DEFAULT_ANTHROPIC_MODEL = process.env.AUBADE_MODEL || 'claude-opus-4-7';
const DEFAULT_OPENAI_MODEL = process.env.AUBADE_OPENAI_MODEL || 'gpt-4o';
const MAX_ATTEMPTS = Number(process.env.AUBADE_MAX_ATTEMPTS || 3);

function parseScriptResponse(raw) {
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.openingLine || !parsed.script || !parsed.commitment) {
    throw new Error('Script response missing required fields: openingLine, script, commitment');
  }
  return {
    openingLine: String(parsed.openingLine).trim(),
    script: String(parsed.script).trim(),
    commitment: String(parsed.commitment).trim(),
    moodTag: parsed.moodTag || 'clear'
  };
}

async function generateWithAnthropic({ system, user, model }) {
  const client = new Anthropic();
  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }]
  });
  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
  return parseScriptResponse(text);
}

async function generateWithOpenAI({ system, user, model }) {
  const client = new OpenAI();
  const response = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    temperature: 0.4,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  });
  const text = response.choices[0]?.message?.content || '';
  return parseScriptResponse(text);
}

function chooseProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  throw new Error('No LLM key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}

async function callProvider(provider, promptArgs) {
  if (provider === 'anthropic') return generateWithAnthropic({ ...promptArgs, model: DEFAULT_ANTHROPIC_MODEL });
  return generateWithOpenAI({ ...promptArgs, model: DEFAULT_OPENAI_MODEL });
}

export async function generateScript({ signals, yesterday, durationSeconds, operatorName, strict = false }) {
  const provider = chooseProvider();
  let lastProblems = [];
  let script;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const extraNotes = attempt > 1
      ? `Previous attempt failed the style rubric with the following problems. Fix them. Do not repeat banned phrasing. Problems:\n${summarizeProblems(lastProblems)}`
      : null;

    const { system, user, epigraph } = buildPrompt({
      signals, yesterday, durationSeconds, operatorName, extraNotes
    });

    script = await callProvider(provider, { system, user });
    const verdict = validateScript(script);
    if (verdict.ok) {
      return { ...script, epigraph, attempts: attempt, provider, generatedAt: new Date().toISOString() };
    }
    lastProblems = verdict.problems;
    if (process.env.AUBADE_DEBUG) {
      console.error(`  [attempt ${attempt}] rubric failed:\n${summarizeProblems(verdict.problems)}`);
    }
  }

  if (strict) {
    throw new Error(`Script failed the style rubric after ${MAX_ATTEMPTS} attempts:\n${summarizeProblems(lastProblems)}`);
  }

  const { epigraph } = buildPrompt({ signals, yesterday, durationSeconds, operatorName });
  return {
    ...script,
    epigraph,
    attempts: MAX_ATTEMPTS,
    provider,
    rubricWarnings: lastProblems,
    generatedAt: new Date().toISOString()
  };
}

export { buildPrompt };
