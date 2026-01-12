export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  icon?: string;
}

// Default templates (fallback if backend is unavailable)
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "daily-notes",
    name: "Daily Notes",
    description: "Template for daily journaling and notes",
    content: `# ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## Morning
- 

## Afternoon
- 

## Evening
- 

## Notes
`,
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Template for meeting notes and action items",
    content: `# Meeting: [Topic]

**Date:** ${new Date().toLocaleDateString()}
**Time:** 
**Attendees:** 

## Agenda
1. 
2. 
3. 

## Discussion
- 

## Action Items
- [ ] 
- [ ] 
- [ ] 

## Next Steps
`,
  },
  {
    id: "food-recipe",
    name: "Food Recipe",
    description: "Template for recipes and cooking notes",
    content: `# [Recipe Name]

**Prep Time:** 
**Cook Time:** 
**Servings:** 

## Ingredients
- 
- 
- 

## Instructions
1. 
2. 
3. 

## Notes
`,
  },
  {
    id: "project-plan",
    name: "Project Plan",
    description: "Template for project planning and tracking",
    content: `# [Project Name]

**Status:** 
**Start Date:** 
**Target Date:** 

## Overview
 

## Goals
- 
- 
- 

## Tasks
- [ ] 
- [ ] 
- [ ] 

## Resources
- 

## Notes
`,
  },
  {
    id: "book-notes",
    name: "Book Notes",
    description: "Template for book reading notes and summaries",
    content: `# [Book Title]

**Author:** 
**Date Started:** 
**Date Finished:** 
**Rating:** ⭐⭐⭐⭐⭐

## Summary
 

## Key Takeaways
- 
- 
- 

## Quotes
> 

## Notes
`,
  },
  {
    id: "idea-brainstorm",
    name: "Idea Brainstorm",
    description: "Template for brainstorming and idea generation",
    content: `# [Topic/Idea]

**Date:** ${new Date().toLocaleDateString()}

## Core Concept
 

## Key Points
- 
- 
- 

## Pros
- 
- 

## Cons
- 
- 

## Next Steps
- [ ] 
- [ ] 
`,
  },
];

// Cache for templates fetched from backend
let templatesCache: Template[] | null = null;
let templatesFetchPromise: Promise<Template[]> | null = null;

/**
 * Fetch templates from backend API (supports ConfigMap override)
 * Falls back to defaults if backend is unavailable
 */
const fetchTemplatesFromBackend = async (): Promise<Template[]> => {
  if (templatesCache) {
    return templatesCache;
  }

  if (templatesFetchPromise) {
    return templatesFetchPromise;
  }

  templatesFetchPromise = (async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        templatesCache = data;
        return templatesCache;
      }
    } catch (error) {
      console.warn("Failed to fetch templates from backend, using defaults:", error);
    }
    // Fallback to defaults
    return DEFAULT_TEMPLATES;
  })();

  return templatesFetchPromise;
};

/**
 * Get templates - fetches from backend first, falls back to defaults
 */
export const getTemplates = async (): Promise<Template[]> => {
  return fetchTemplatesFromBackend();
};

/**
 * Get templates synchronously (for immediate use, may return defaults)
 * Use getTemplates() for async fetching from backend
 */
export const TEMPLATES = DEFAULT_TEMPLATES;

