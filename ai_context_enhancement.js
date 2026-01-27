// AI Assistant Context Enhancement Script
// This script adds context-aware functionality to AiAssistant.tsx

// 1. Add supabase import after line 5
const supabaseImport = "import { supabase } from '../lib/supabaseClient';";

// 2. Add buildUserContext function after line 54 (after useEffect)
const buildUserContextFunction = `
    // Fetch user learning context from Supabase
    const buildUserContext = async (user: any) => {
        if (!user) return { activeCourse: null, lastChapter: null, progressPercent: 0 };
        
        try {
            const { data, error } = await supabase
                .from('app_user_progress')
                .select('*, app_courses(*)')
                .eq('user_id', user.id)
                .order('last_accessed', { ascending: false })
                .limit(1);

            if (error || !data || data.length === 0) {
                return { activeCourse: null, lastChapter: null, progressPercent: 0 };
            }

            const progress = data[0];
            const completedChapters = progress.completed_chapters || [];
            const lastChapter = completedChapters.length > 0 
                ? completedChapters[completedChapters.length - 1] 
                : null;

            return {
                activeCourse: progress.app_courses,
                lastChapter: lastChapter,
                progressPercent: progress.progress || 0
            };
        } catch (err) {
            console.error('Context fetch error:', err);
            return { activeCourse: null, lastChapter: null, progressPercent: 0 };
        }
    };
`;

// 3. Replace system instruction (around line 92)
const dynamicSystemPrompt = `
            // Build user context
            const userContext = await buildUserContext(currentUser);
            
            // Dynamic System Instruction based on user context
            const systemPrompt = \`You are ProjectFlow AI, an expert Enterprise Project Management assistant.

**User Profile**:
- Name: \${currentUser?.name || 'User'}
- Role: \${currentUser?.role || 'Student'}  
- XP: \${currentUser?.xp || 0} points
- Streak: \${currentUser?.streak || 0} days
\${userContext.activeCourse ? \`- Current Course: \${userContext.activeCourse.title}\` : ''}
\${userContext.lastChapter ? \`- Last Completed: \${userContext.lastChapter}\` : ''}
\${userContext.progressPercent > 0 ? \`- Progress: \${userContext.progressPercent}%\` : ''}

**Your Responsibilities**:
1. Provide personalized PM knowledge based on user's current learning progress
2. If user is taking a course, prioritize content related to that course
3. Adjust answer complexity based on user's XP and role
4. Use Markdown formatting for professional, concise, structured answers
5. Suggest next learning steps or practice projects when appropriate

**Answer Guidelines**:
- Beginners (XP < 500): Focus on basic concepts with examples
- Intermediate (XP 500-2000): Provide in-depth analysis and best practices
- Advanced (XP > 2000): Discuss advanced applications and strategic decisions

Always be friendly, professional, and encourage continuous learning.\`;
`;

console.log("Enhancement script prepared. Apply these changes manually to AiAssistant.tsx");
