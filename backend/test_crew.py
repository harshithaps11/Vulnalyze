import os
from dotenv import load_dotenv

# Load env to get OPENAI_API_KEY
load_dotenv(".env")

from app.services.crew_agent import RemediationCrew

def test_crew():
    vuln_id = "1"
    title = "SQL Injection in User Login"
    description = "The login function concatenates user input directly into the SQL query without parameterization, leading to SQL injection vulnerabilities."
    source_code = """
def login(username, password):
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    return cursor.fetchone()
"""
    language = "python"
    
    crew = RemediationCrew(vuln_id, title, description, source_code, language)
    
    print("Kicking off Remediation Crew...")
    result = crew.run()
    
    print("\n--- Result ---")
    print(result)

if __name__ == "__main__":
    test_crew()
