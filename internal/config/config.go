package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pkg/errors"
)

// Template represents a memo template
type Template struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Icon        string `json:"icon,omitempty"`
}

// AIPromptConfig represents AI prompt configuration
type AIPromptConfig struct {
	TagGenerationPrompt      string `json:"tagGenerationPrompt"`
	AssistantSuggestionsPrompt string `json:"assistantSuggestionsPrompt"`
	AssistantRewritePrompt    string `json:"assistantRewritePrompt"`
	AssistantEnhanceSlightPrompt string `json:"assistantEnhanceSlightPrompt"`
	AssistantEnhanceElaboratePrompt string `json:"assistantEnhanceElaboratePrompt"`
}

// Config represents the full configuration
type Config struct {
	Templates []Template     `json:"templates"`
	AIPrompts AIPromptConfig `json:"aiPrompts"`
}

// LoadConfig loads configuration from a JSON file in the data directory
// Falls back to defaults if file doesn't exist
func LoadConfig(dataDir string) (*Config, error) {
	configPath := filepath.Join(dataDir, "config.json")

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Return default config if file doesn't exist
		return GetDefaultConfig(), nil
	}

	// Read config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to read config file: %s", configPath)
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, errors.Wrapf(err, "failed to parse config file: %s", configPath)
	}

	// Merge with defaults (user config overrides defaults)
	defaultConfig := GetDefaultConfig()
	if len(config.Templates) == 0 {
		config.Templates = defaultConfig.Templates
	}
	if config.AIPrompts.TagGenerationPrompt == "" {
		config.AIPrompts.TagGenerationPrompt = defaultConfig.AIPrompts.TagGenerationPrompt
	}
	if config.AIPrompts.AssistantSuggestionsPrompt == "" {
		config.AIPrompts.AssistantSuggestionsPrompt = defaultConfig.AIPrompts.AssistantSuggestionsPrompt
	}
	if config.AIPrompts.AssistantRewritePrompt == "" {
		config.AIPrompts.AssistantRewritePrompt = defaultConfig.AIPrompts.AssistantRewritePrompt
	}
	if config.AIPrompts.AssistantEnhanceSlightPrompt == "" {
		config.AIPrompts.AssistantEnhanceSlightPrompt = defaultConfig.AIPrompts.AssistantEnhanceSlightPrompt
	}
	if config.AIPrompts.AssistantEnhanceElaboratePrompt == "" {
		config.AIPrompts.AssistantEnhanceElaboratePrompt = defaultConfig.AIPrompts.AssistantEnhanceElaboratePrompt
	}

	return &config, nil
}

// GetDefaultConfig returns the default configuration (hardcoded defaults)
func GetDefaultConfig() *Config {
	return &Config{
		Templates: []Template{
			{
				ID:          "daily-notes",
				Name:        "Daily Notes",
				Description: "Template for daily journaling and notes",
				Content:     "# {{DATE}}\n\n## Morning\n- \n\n## Afternoon\n- \n\n## Evening\n- \n\n## Notes\n",
			},
			{
				ID:          "meeting-notes",
				Name:        "Meeting Notes",
				Description: "Template for meeting notes and action items",
				Content:     "# Meeting: [Topic]\n\n**Date:** {{DATE}}\n**Time:** \n**Attendees:** \n\n## Agenda\n1. \n2. \n3. \n\n## Discussion\n- \n\n## Action Items\n- [ ] \n- [ ] \n- [ ] \n\n## Next Steps\n",
			},
			{
				ID:          "food-recipe",
				Name:        "Food Recipe",
				Description: "Template for recipes and cooking notes",
				Content:     "# [Recipe Name]\n\n**Prep Time:** \n**Cook Time:** \n**Servings:** \n\n## Ingredients\n- \n- \n- \n\n## Instructions\n1. \n2. \n3. \n\n## Notes\n",
			},
			{
				ID:          "project-plan",
				Name:        "Project Plan",
				Description: "Template for project planning and tracking",
				Content:     "# [Project Name]\n\n**Status:** \n**Start Date:** \n**Target Date:** \n\n## Overview\n \n\n## Goals\n- \n- \n- \n\n## Tasks\n- [ ] \n- [ ] \n- [ ] \n\n## Resources\n- \n\n## Notes\n",
			},
			{
				ID:          "book-notes",
				Name:        "Book Notes",
				Description: "Template for book reading notes and summaries",
				Content:     "# [Book Title]\n\n**Author:** \n**Date Started:** \n**Date Finished:** \n**Rating:** ⭐⭐⭐⭐⭐\n\n## Summary\n \n\n## Key Takeaways\n- \n- \n- \n\n## Quotes\n> \n\n## Notes\n",
			},
			{
				ID:          "idea-brainstorm",
				Name:        "Idea Brainstorm",
				Description: "Template for brainstorming and idea generation",
				Content:     "# [Topic/Idea]\n\n**Date:** {{DATE}}\n\n## Core Concept\n \n\n## Key Points\n- \n- \n- \n\n## Pros\n- \n- \n\n## Cons\n- \n- \n\n## Next Steps\n- [ ] \n- [ ] \n",
			},
		},
		AIPrompts: AIPromptConfig{
			TagGenerationPrompt: `Analyze the following memo content and generate exactly 3 relevant tags. Tags should be:
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

Return only the 3 tags, one per line, without numbering, bullets, or prefixes:`,
			AssistantSuggestionsPrompt: `You are an AI writing assistant helping to enhance a note/memo. Analyze the context and provide 3 contextual suggestions to continue or enhance the writing at the current cursor position.

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

Return only the suggestions, one per line, without numbering, bullets, or prefixes:`,
			AssistantRewritePrompt: `Rewrite the following note/memo completely. You have full flexibility to:
- Restructure the content
- Improve clarity and flow
- Enhance the writing style
- Reorganize ideas
- Make it more engaging and professional

Original content:
{{CONTENT}}

Provide a completely rewritten version that improves upon the original:`,
			AssistantEnhanceSlightPrompt: `Enhance the following note/memo with SLIGHT changes only. You must:
- Keep ALL the original ideas and content
- Make MINOR improvements to grammar, clarity, and flow
- Fix typos and awkward phrasing
- Do NOT add any new ideas, topics, or content
- Do NOT expand on existing points
- Only refine what's already there

Content:
{{CONTENT}}

Provide the slightly enhanced version (same length, same ideas, just refined):`,
			AssistantEnhanceElaboratePrompt: `Enhance the following note/memo to make it MORE ELABORATE, but CRITICALLY: you must NOT add any new ideas, topics, or content beyond what the user has written. You can:
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

Provide the more elaborate version (expanding only on existing content, no new ideas):`,
		},
	}
}

// GetConfigPath returns the path to the config file
func GetConfigPath(dataDir string) string {
	return filepath.Join(dataDir, "config.json")
}

// ValidateConfig validates the configuration
func ValidateConfig(config *Config) error {
	if config == nil {
		return fmt.Errorf("config is nil")
	}

	// Validate templates
	templateIDs := make(map[string]bool)
	for _, template := range config.Templates {
		if template.ID == "" {
			return fmt.Errorf("template ID cannot be empty")
		}
		if template.Name == "" {
			return fmt.Errorf("template name cannot be empty for ID: %s", template.ID)
		}
		if templateIDs[template.ID] {
			return fmt.Errorf("duplicate template ID: %s", template.ID)
		}
		templateIDs[template.ID] = true
	}

	return nil
}
