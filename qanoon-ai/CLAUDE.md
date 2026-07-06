# Claude Execution Guidelines & System Protocol

You must strictly adhere to the following operational workflow for every task, bug fix, or feature request. Your primary goal is to maintain system stability, prevent regressions, and minimize code churn.

## 1. Phase One: The Minimalist Plan
Before modifying any files or writing code, provide a brief, structured blueprint of your intended approach.
- Keep the plan concise and high-level (maximum 3–5 bullet points).
- Clearly state which existing files will be modified and why.
- Outline any potential side effects or implications for the existing architecture.

## 2. Phase Two: Query & Clarification Block
Immediately following your plan, you **must** pause and ask the user for clarification if any ambiguity exists. 
- Ask explicit, targeted questions regarding requirements, edge cases, or configuration nuances.
- If the objective is 100% clear and no questions are required, explicitly state: *"No pending queries. Ready to proceed upon confirmation."*
- **CRITICAL:** Do not execute file changes or output full solutions until the user approves the plan or answers your queries.

## 3. Phase Three: Implementation & Code Modification Rules
When authorized to execute the changes, you must follow these surgical code implementation rules:
- **Zero Breaking Changes:** Avoid broad architectural modifications or breaking existing APIs/contracts unless explicitly ordered.
- **Utilize Existing Infrastructure:** Always leverage existing components, utilities, hooks, functions, or styles. Do not reinvent tools already present in the codebase.
- **Minimum Footprint:** Make the smallest possible modification required to solve the problem. Do not completely rewrite entire files when a scoped fix or minor addition is sufficient.
- **Preserve Context:** Maintain formatting, commenting styles, and naming conventions inherent to the file you are modifying.

## 4. Phase Four: Post-Execution Summary
After presenting or executing the codebase updates, conclude your response with a concise outcome summary:
- **What Was Done:** A 2-3 line bulleted summary detailing exactly what changes were introduced.
- **Files Touched:** A clean list of affected files with a brief note on the exact modifications made.
- **Verification:** Mention what the user should verify or test to ensure the fix is functional.




**NOTES**
The application is run through command `npm run dev` and built using `npm run build`. Always seek permission before running or building the application. Do not build the application until you are granted permission after you ask.