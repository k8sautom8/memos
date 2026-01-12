import { ollamaService } from "./ollamaService";
import { userServiceClient } from "@/connect";

// Cache for AI prompt config fetched from backend
interface AIPromptConfig {
  tagGenerationPrompt: string;
  assistantSuggestionsPrompt: string;
  assistantRewritePrompt: string;
  assistantEnhanceSlightPrompt: string;
  assistantEnhanceElaboratePrompt: string;
}

let promptConfigCache: AIPromptConfig | null = null;
let promptConfigFetchPromise: Promise<AIPromptConfig> | null = null;


// Default prompts (fallback if backend is unavailable) - exported for use by ollamaService
export const DEFAULT_TAG_GENERATION_PROMPT = `Analyze the following memo content and generate exactly 3 relevant tags. Tags should be:
1. Short (1-3 words each)
2. Descriptive and relevant to the content
3. Lowercase with no special characters (use underscores for spaces if needed)
4. Focused on the main topics/themes
5. **CRITICALLY IMPORTANT**: Reuse existing tags when possible to minimize tag proliferation and maintain consistency

{{EXISTING_TAGS}}

**Instructions:**
- FIRST check if any existing tags match the content - REUSE them if they fit
- Only create NEW tags if no existing tags are appropriate
- Prioritize existing tags over creating new ones
- This helps keep the tag list manageable and searchable

Content:
{{CONTENT}}

Return only the 3 tags, one per line, without numbering, bullets, or prefixes:`;

export const DEFAULT_ASSISTANT_SUGGESTIONS_PROMPT = `You are an AI writing assistant helping to enhance a note/memo. Analyze the context and provide 3 contextual suggestions to continue or enhance the writing at the current cursor position.

Full Context:
{{FULL_CONTEXT}}

Current Position Context:
{{CONTEXT_BEFORE}}[CURSOR]{{CONTEXT_AFTER}}

Current line being typed: "{{CURRENT_LINE}}"

Provide 3 suggestions that:
1. Are contextually relevant to the existing content
2. Enhance or continue the current thought/idea
3. Are concise (one sentence each)
4. Flow naturally from what's already written

Return only the suggestions, one per line, without numbering, bullets, or prefixes:`;

export const DEFAULT_ASSISTANT_REWRITE_PROMPT = `Rewrite the following note/memo completely. You have full flexibility to:
- Restructure the content
- Improve clarity and flow
- Enhance the writing style
- Reorganize ideas
- Make it more engaging and professional

Original content:
{{CONTENT}}

Provide a completely rewritten version that improves upon the original:`;

export const DEFAULT_ASSISTANT_ENHANCE_SLIGHT_PROMPT = `Enhance the following note/memo with SLIGHT changes only. You must:
- Keep ALL the original ideas and content
- Make MINOR improvements to grammar, clarity, and flow
- Fix typos and awkward phrasing
- Do NOT add any new ideas, topics, or content
- Do NOT expand on existing points
- Only refine what's already there

Content:
{{CONTENT}}

Provide the slightly enhanced version (same length, same ideas, just refined):`;

export const DEFAULT_ASSISTANT_ENHANCE_ELABORATE_PROMPT = `Enhance the following note/memo to make it MORE ELABORATE, but CRITICALLY: you must NOT add any new ideas, topics, or content beyond what the user has written. You can:
- Expand on existing points with more detail
- Add examples, explanations, or context for existing ideas
- Improve structure and flow
- Make it more comprehensive and detailed
- Use better vocabulary and phrasing

BUT you must NOT:
- Introduce new topics or ideas
- Add information not implied in the original content
- Go beyond what the user has written

Content:
{{CONTENT}}

Provide the more elaborate version (expanding only on existing content, no new ideas):`;

/**
 * Fetch AI prompt config from backend API (supports ConfigMap override)
 * Falls back to defaults if backend is unavailable
 */
const fetchPromptConfigFromBackend = async (): Promise<AIPromptConfig> => {
  if (promptConfigCache) {
    return promptConfigCache;
  }

  if (promptConfigFetchPromise) {
    return promptConfigFetchPromise;
  }

  promptConfigFetchPromise = (async () => {
    try {
      const response = await fetch("/api/ai-prompts");
      if (response.ok) {
        const data = await response.json();
        promptConfigCache = data;
        return promptConfigCache;
      }
    } catch (error) {
      console.warn("Failed to fetch AI prompt config from backend, using defaults:", error);
    }
    // Fallback to defaults
    return {
      tagGenerationPrompt: DEFAULT_TAG_GENERATION_PROMPT,
      assistantSuggestionsPrompt: DEFAULT_ASSISTANT_SUGGESTIONS_PROMPT,
      assistantRewritePrompt: DEFAULT_ASSISTANT_REWRITE_PROMPT,
      assistantEnhanceSlightPrompt: DEFAULT_ASSISTANT_ENHANCE_SLIGHT_PROMPT,
      assistantEnhanceElaboratePrompt: DEFAULT_ASSISTANT_ENHANCE_ELABORATE_PROMPT,
    };
  })();

  return promptConfigFetchPromise;
};

/**
 * Fetch existing tags for the current user
 */
async function fetchExistingTags(): Promise<string[]> {
  try {
    // Get current user - we'll need to pass this in or get it from context
    // For now, we'll fetch all user stats and aggregate tags
    const { stats } = await userServiceClient.listAllUserStats({});
    
    // Aggregate all tags from all users
    const allTags = new Set<string>();
    for (const userStats of stats) {
      if (userStats.tagCount) {
        for (const tag of Object.keys(userStats.tagCount)) {
          // Remove # prefix if present, normalize to lowercase
          const normalizedTag = tag.replace(/^#/, "").toLowerCase();
          if (normalizedTag.length > 0) {
            allTags.add(normalizedTag);
          }
        }
      }
    }
    
    // Sort by frequency (most used first) for better suggestions
    const tagFrequency: Array<{ tag: string; count: number }> = [];
    for (const userStats of stats) {
      if (userStats.tagCount) {
        for (const [tag, count] of Object.entries(userStats.tagCount)) {
          const normalizedTag = tag.replace(/^#/, "").toLowerCase();
          const existing = tagFrequency.find((t) => t.tag === normalizedTag);
          if (existing) {
            existing.count += count;
          } else {
            tagFrequency.push({ tag: normalizedTag, count });
          }
        }
      }
    }
    
    // Sort by frequency (descending) and return top 50 most used tags
    tagFrequency.sort((a, b) => b.count - a.count);
    return tagFrequency.slice(0, 50).map((t) => t.tag);
  } catch (error) {
    console.warn("Failed to fetch existing tags:", error);
    return [];
  }
}

export const tagService = {
  /**
   * Generate 3 tags for a memo using AI, reusing existing tags where possible
   */
  async generateTags(content: string, currentUserName?: string): Promise<string[]> {
    try {
      // Fetch existing tags to encourage reuse
      const existingTags = await fetchExistingTags();
      
      // Fetch prompt config from backend (supports ConfigMap override)
      const promptConfig = await fetchPromptConfigFromBackend();
      
      // Format existing tags for the prompt
      const existingTagsList = existingTags.length > 0
        ? `\n\nExisting tags in use (REUSE these when appropriate, especially for similar topics):\n${existingTags.slice(0, 30).map(tag => `- ${tag}`).join("\n")}${existingTags.length > 30 ? `\n... and ${existingTags.length - 30} more` : ""}`
        : "";
      
      // Replace placeholders
      let prompt = promptConfig.tagGenerationPrompt
        .replace("{{CONTENT}}", content.length < 1500 ? content : content.slice(0, 1500))
        .replace("{{EXISTING_TAGS}}", existingTagsList);
      
      // If {{EXISTING_TAGS}} placeholder wasn't in the prompt, append it
      if (!promptConfig.tagGenerationPrompt.includes("{{EXISTING_TAGS}}")) {
        prompt += existingTagsList;
      }

      const response = await ollamaService.generateCompletion(prompt);
      
      let tags = response
        .split("\n")
        .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, "").replace(/\s+/g, "_"))
        .filter((tag) => tag.length > 0 && tag.length < 30)
        .slice(0, 3);
      
      // Try to match generated tags with existing tags (fuzzy matching)
      const matchedTags: string[] = [];
      const newTags: string[] = [];
      
      for (const generatedTag of tags) {
        // Check for exact match
        const exactMatch = existingTags.find((existing) => existing === generatedTag);
        if (exactMatch) {
          matchedTags.push(exactMatch);
          continue;
        }
        
        // Check for similar tags (contains or is contained)
        const similarMatch = existingTags.find((existing) => 
          existing.includes(generatedTag) || generatedTag.includes(existing)
        );
        if (similarMatch && similarMatch.length <= generatedTag.length + 2) {
          // Prefer existing tag if it's similar and not much longer
          matchedTags.push(similarMatch);
          continue;
        }
        
        // New tag
        newTags.push(generatedTag);
      }
      
      // Combine matched and new tags, prioritizing matched (existing) tags
      tags = [...matchedTags, ...newTags].slice(0, 3);
      
      // Add # prefix for searchability
      tags = tags.map((tag) => `#${tag}`);

      // Fallback if AI doesn't return enough tags
      if (tags.length < 3) {
        // Extract simple keywords from content as fallback
        const words = content
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .filter((w) => !["the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use"].includes(w))
          .slice(0, 3)
          .map((word) => `#${word}`); // Add # prefix for searchability
        return [...tags, ...words].slice(0, 3);
      }

      return tags;
    } catch (error) {
      console.error("Failed to generate tags:", error);
      // Return empty array on error - tags are optional
      return [];
    }
  },
};

