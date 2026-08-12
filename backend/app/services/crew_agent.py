import os
from pydantic import BaseModel, Field
from typing import Optional

# We need to gracefully import crewai so it doesn't break if not fully installed yet during the pip run
try:
    from crewai import Agent, Task, Crew, Process
    # Ensure OPENAI_API_KEY is present or CrewAI might throw an error on instantiation
    # CrewAI automatically uses LangChain's ChatOpenAI under the hood by default
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False


class PatchResult(BaseModel):
    """The structured output format for the Crew's final patch generation."""
    explanation: str = Field(description="Explanation of the vulnerability and the proposed fix.")
    diff: str = Field(description="The actual unified diff or the complete rewritten source code file replacing the vulnerable code.")


class RemediationCrew:
    def __init__(self, vulnerability_id: str, title: str, description: str, source_code: str, language: str):
        self.vulnerability_id = vulnerability_id
        self.title = title
        self.description = description
        self.source_code = source_code
        self.language = language

    def _get_llm(self):
        from langchain_openai import ChatOpenAI
        
        # Try to use OpenRouter if OPENROUTER_API_KEY is available (as it is in ai.py)
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            return ChatOpenAI(
                model="anthropic/claude-3-haiku", # or a better reasoning model like sonnet
                openai_api_key=openrouter_key,
                openai_api_base="https://openrouter.ai/api/v1",
            )
            
        # Fallback to standard OpenAI if available
        return ChatOpenAI(model="gpt-4o")

    def _create_agents(self):
        llm = self._get_llm()
        
        security_analyst = Agent(
            role='Senior Security Analyst',
            goal='Analyze application vulnerabilities and determine the precise root cause and required security controls.',
            backstory=(
                "You are an elite application security expert with deep knowledge of OWASP Top 10, CWEs, "
                "and secure coding practices. Your job is to analyze vulnerability reports, understand "
                "exactly why the provided code is vulnerable, and explain the necessary mitigations."
            ),
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        senior_developer = Agent(
            role='Senior Software Engineer',
            goal=f'Write secure, robust {self.language} code to fix vulnerabilities without breaking business logic.',
            backstory=(
                f"You are a principal software engineer specializing in {self.language}. "
                "You write exceptionally clean, maintainable, and secure code. You take "
                "requirements from security analysts and implement them perfectly."
            ),
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        qa_reviewer = Agent(
            role='QA & Security Reviewer',
            goal='Review code patches to ensure they are syntactically correct, resolve the vulnerability, and do not introduce regressions.',
            backstory=(
                "You are a meticulous Code Reviewer and QA Engineer. You do not write code from scratch, "
                "but you are an expert at spotting syntax errors, logical flaws, and incomplete security fixes "
                "in other people's patches."
            ),
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

        return security_analyst, senior_developer, qa_reviewer

    def _create_tasks(self, security_analyst, senior_developer, qa_reviewer):
        task_analyze = Task(
            description=(
                f"Vulnerability Title: {self.title}\n"
                f"Description: {self.description}\n\n"
                f"Vulnerable {self.language} Code:\n```\n{self.source_code}\n```\n\n"
                "Analyze the provided code and description. Identify the exact lines that are vulnerable and "
                "explain what secure coding pattern or library is needed to fix it."
            ),
            expected_output="A detailed explanation of the root cause and the specific mitigation strategy required.",
            agent=security_analyst
        )

        task_patch = Task(
            description=(
                "Using the mitigation strategy provided by the Security Analyst, rewrite the vulnerable code to be secure. "
                "Ensure that you do not change the core business logic or function signatures unless absolutely necessary for security. "
                "Output the fully corrected code."
            ),
            expected_output="The rewritten, secure source code snippet.",
            agent=senior_developer
        )

        task_review = Task(
            description=(
                "Review the secure code generated by the Senior Developer. "
                "Verify that it addresses the original vulnerability and is syntactically valid. "
                "If it looks good, prepare the final output as a PatchResult."
            ),
            expected_output="A final explanation of the fix and the secure code patch.",
            agent=qa_reviewer,
            output_json=PatchResult
        )

        return [task_analyze, task_patch, task_review]

    def run(self) -> dict:
        if not CREWAI_AVAILABLE:
            return {
                "explanation": "CrewAI is not installed or configured correctly.",
                "diff": ""
            }
            
        if not os.environ.get("OPENAI_API_KEY") and not os.environ.get("OPENROUTER_API_KEY"):
            return {
                "explanation": "No API key found. Please set OPENROUTER_API_KEY or OPENAI_API_KEY.",
                "diff": ""
            }

        security_analyst, senior_developer, qa_reviewer = self._create_agents()
        tasks = self._create_tasks(security_analyst, senior_developer, qa_reviewer)

        crew = Crew(
            agents=[security_analyst, senior_developer, qa_reviewer],
            tasks=tasks,
            process=Process.sequential,
            verbose=True
        )

        try:
            # Kickoff the crew
            result = crew.kickoff()
            # Result will be a dictionary since output_json=PatchResult is used in the final task
            if hasattr(result, 'json_dict'):
                return result.json_dict
            elif isinstance(result, str):
                # Fallback if CrewAI returns a JSON string
                import json
                try:
                    return json.loads(result)
                except json.JSONDecodeError:
                    return {"explanation": "Fix generated but could not parse output format.", "diff": result}
            else:
                return dict(result)
        except Exception as e:
            return {
                "explanation": f"An error occurred during CrewAI execution: {str(e)}",
                "diff": ""
            }
