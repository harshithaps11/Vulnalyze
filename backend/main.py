from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from typing import Optional, List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter API configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

class CodeRequest(BaseModel):
    code: str

class CodeAnalysisRequest(CodeRequest):
    question: str

class CodeFixRequest(CodeRequest):
    vulnerability: str

async def call_openrouter(messages: List[dict], temperature: float = 0.7) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
            },
            json={
                "model": "anthropic/claude-3-opus-20240229",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 1000
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="OpenRouter API error")
        
        return response.json()

@app.post("/api/analyze")
async def analyze_code(request: CodeAnalysisRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a security-focused AI assistant. Analyze the following code and provide detailed, actionable feedback. Focus on security vulnerabilities, best practices, and potential improvements. Format your response in a clear, structured way with specific examples and fixes."
            },
            {
                "role": "user",
                "content": f"Code to analyze:\n```javascript\n{request.code}\n```\n\nQuestion: {request.question}"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fix")
async def get_code_fix(request: CodeFixRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a security-focused AI assistant. Provide a specific code fix for the given vulnerability. Return ONLY the fixed code, with no explanations or additional text."
            },
            {
                "role": "user",
                "content": f"Fix this vulnerability in the code:\n```javascript\n{request.code}\n```\n\nVulnerability: {request.vulnerability}"
            }
        ]
        
        result = await call_openrouter(messages, temperature=0.3)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/explain")
async def explain_code(request: CodeRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a code explanation expert. Explain the following code in detail, focusing on its purpose, functionality, and key concepts. Format your response in a clear, structured way."
            },
            {
                "role": "user",
                "content": f"Explain this code:\n```javascript\n{request.code}\n```"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/best-practices")
async def get_best_practices(request: CodeRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a code quality expert. Analyze the following code and provide a list of best practices suggestions. Return the response as a JSON array of objects with 'type', 'description', 'impact', and 'priority' fields."
            },
            {
                "role": "user",
                "content": f"Analyze this code for best practices:\n```javascript\n{request.code}\n```"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/performance")
async def analyze_performance(request: CodeRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a performance optimization expert. Analyze the following code and provide performance metrics and recommendations. Return the response as a JSON array of objects with 'metric', 'value', and 'recommendation' fields."
            },
            {
                "role": "user",
                "content": f"Analyze this code for performance:\n```javascript\n{request.code}\n```"
            }
        ]
        
        result = await call_openrouter(messages)
        return {"response": result["choices"][0]["message"]["content"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 