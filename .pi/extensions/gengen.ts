/**
 * gengen provider (project-local)
 *
 * Registers the gengen.farm OpenAI-compatible endpoint as a pi provider.
 * Loaded automatically from .pi/extensions/.
 *
 * Auth: the apiKey is fetched from 1Password at request time via `op read`,
 *   from the "gengen farm" secure-note item (id eqnrweyysyeddb6oxit2zzeqcu).
 *   Requires the 1Password CLI (`op`) to be signed in.
 *
 * Usage after restart:
 *   pi --provider gengen --model glm-5-2-260617
 *   pi --provider gengen --model deepseek-v4-pro-260425
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerProvider("gengen", {
		baseUrl: "https://gengen.farm/api/gengen/v1",
		api: "openai-completions",
		apiKey: "!op read 'op://Personal/gengen farm/notesPlain'",
		models: [
			{
				id: "glm-5-2-260617",
				name: "GLM 5.2 (260617)",
				input: ["text"],
				contextWindow: 1048576,
				maxTokens: 131072,
				reasoning: true,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				thinkingLevelMap: {
					off: null,
					minimal: "high",
					low: "high",
					medium: "high",
					high: "high",
					xhigh: "max",
				},
				compat: {
					supportsDeveloperRole: false,
					supportsReasoningEffort: false,
					maxTokensField: "max_tokens",
					thinkingFormat: "zai",
				},
			},
			{
				id: "deepseek-v4-pro-260425",
				name: "DeepSeek V4 Pro (260425)",
				input: ["text"],
				contextWindow: 1048576,
				maxTokens: 393216,
				reasoning: true,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				thinkingLevelMap: {
					off: null,
					minimal: "low",
					low: "low",
					medium: "medium",
					high: "high",
					xhigh: "high",
				},
				compat: {
					supportsDeveloperRole: false,
					supportsReasoningEffort: false,
					maxTokensField: "max_tokens",
					thinkingFormat: "deepseek",
				},
			},
		],
	});
}
