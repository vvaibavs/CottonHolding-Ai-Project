import json

from google import genai
from google.genai import types

from app.prompts import QUESTIONS_PROMPT, SYSTEM_PROMPT
from app.schemas import BidExtraction, QuestionSet
from app.settings import settings

_client = genai.Client(api_key=settings.gemini_api_key)


async def extract_bid(markdown: str, thinking_budget: int = 4096) -> BidExtraction:
    resp = await _client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=[markdown],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=BidExtraction,
            max_output_tokens=65536,
            temperature=0.1,
            thinking_config=types.ThinkingConfig(thinking_budget=thinking_budget),
            safety_settings=[
                types.SafetySetting(category=c, threshold="BLOCK_NONE")
                for c in (
                    "HARM_CATEGORY_HARASSMENT",
                    "HARM_CATEGORY_HATE_SPEECH",
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "HARM_CATEGORY_DANGEROUS_CONTENT",
                )
            ],
        ),
    )
    return BidExtraction.model_validate_json(resp.text)


async def generate_questions(extraction: BidExtraction) -> QuestionSet:
    grounded_input = {
        "ambiguities": [a.model_dump() for a in extraction.ambiguities],
        "risks": [r.model_dump() for r in extraction.risks],
        "missing_info": extraction.missing_info,
        "key_dates": [d.model_dump() for d in extraction.key_dates],
        "callouts": [
            c.model_dump() for c in extraction.callouts
            if c.severity in ("elevated", "critical")
        ],
    }
    resp = await _client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=[json.dumps(grounded_input)],
        config=types.GenerateContentConfig(
            system_instruction=QUESTIONS_PROMPT,
            response_mime_type="application/json",
            response_schema=QuestionSet,
            temperature=0.2,
            max_output_tokens=2048,
            thinking_config=types.ThinkingConfig(thinking_budget=1024),
            safety_settings=[
                types.SafetySetting(category=c, threshold="BLOCK_NONE")
                for c in (
                    "HARM_CATEGORY_HARASSMENT",
                    "HARM_CATEGORY_HATE_SPEECH",
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "HARM_CATEGORY_DANGEROUS_CONTENT",
                )
            ],
        ),
    )
    return QuestionSet.model_validate_json(resp.text)
