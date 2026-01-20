import { templates, type CharacterTemplate } from '@elizagotchi/agent-templates';
import type { AgentType } from '@elizagotchi/shared';

export interface LoadedCharacter extends CharacterTemplate {
  merged: boolean;
  customizations?: {
    name?: string;
    personality?: string;
    rules?: string[];
    tone?: string;
  };
}

export function loadCharacterTemplate(agentType: AgentType): CharacterTemplate {
  const template = templates[agentType];
  if (!template) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }
  return template;
}

export function mergeCustomizations(
  template: CharacterTemplate,
  customizations?: {
    name?: string;
    personality?: string;
    rules?: string[];
    tone?: string;
  }
): LoadedCharacter {
  if (!customizations) {
    return { ...template, merged: false };
  }

  const mergedBio = customizations.personality
    ? [...template.bio, customizations.personality]
    : template.bio;

  const mergedStyle = {
    ...template.style,
    all: [...template.style.all, ...(customizations.rules || [])],
  };

  // Add tone to style if specified
  if (customizations.tone) {
    const toneRules: Record<string, string[]> = {
      formal: ['Use formal language', 'Avoid contractions', 'Be professional'],
      casual: ['Use casual language', 'Be friendly and relaxed'],
      friendly: ['Be warm and approachable', 'Use encouraging language'],
      professional: ['Maintain professional demeanor', 'Be clear and concise'],
    };
    mergedStyle.all = [...mergedStyle.all, ...(toneRules[customizations.tone] || [])];
  }

  return {
    ...template,
    name: customizations.name || template.name,
    bio: mergedBio,
    style: mergedStyle,
    merged: true,
    customizations,
  };
}

export function buildSystemPrompt(character: CharacterTemplate): string {
  const sections = [
    `You are ${character.name}.`,
    '',
    '## About You',
    ...character.bio.map((line) => `- ${line}`),
    '',
    '## Your Background',
    ...character.lore.map((line) => `- ${line}`),
    '',
    '## Your Knowledge',
    ...character.knowledge.map((line) => `- ${line}`),
    '',
    '## Communication Style',
    ...character.style.all.map((line) => `- ${line}`),
    '',
    '## Your Personality',
    `You are: ${character.adjectives.join(', ')}`,
    '',
    '## Topics You Discuss',
    character.topics.join(', '),
  ];

  return sections.join('\n');
}

export function formatExampleConversation(
  examples: CharacterTemplate['messageExamples']
): string {
  if (!examples.length) return '';

  const formatted = examples
    .map((conversation) =>
      conversation
        .map((msg) => `${msg.user}: ${msg.content.text}`)
        .join('\n')
    )
    .join('\n\n');

  return `## Example Conversations\n\n${formatted}`;
}
