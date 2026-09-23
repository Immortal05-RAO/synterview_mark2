import json
import re
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from src.config import settings
from src.services.question_bank import get_fallback_questions

logger = logging.getLogger("synterview")


class AIProvider(ABC):
    @abstractmethod
    async def generate_questions(
        self,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        count: int = 5,
        previous_questions: List[str] = None
    ) -> List[Dict[str, str]]:
        """Generate list of question dicts with 'text', 'category', 'difficulty'."""
        pass

    @abstractmethod
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        speech_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate candidate answer and return structured scores and feedback."""
        pass

    @abstractmethod
    async def generate_hint(
        self,
        question: str,
        hint_level: int,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        """Generate progressive hint for current question (level 1-5)."""
        pass

    @abstractmethod
    async def generate_ideal_answer(
        self,
        question: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        """Generate comprehensive ideal answer for current question."""
        pass



class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.AI_API_KEY
        self.model = model or settings.AI_MODEL or "gpt-4o-mini"

    async def generate_questions(
        self,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        count: int = 5,
        previous_questions: List[str] = None
    ) -> List[Dict[str, str]]:
        if not self.api_key:
            return await FallbackProvider().generate_questions(role, experience, difficulty, interview_type, count, previous_questions)

        import httpx
        previous_str = ", ".join([f'"{q}"' for q in (previous_questions or [])])
        prompt = (
            f"You are an expert technical interviewer conducting a {difficulty} {interview_type} mock interview for a {role} ({experience} level).\n"
            f"Generate exactly {count} distinct, highly relevant interview questions.\n"
            f"Do not include any of these previously asked questions: [{previous_str}].\n"
            "Respond ONLY with a valid JSON array of objects, where each object has keys:\n"
            '  "text": question string,\n'
            '  "category": topic category (e.g. "Architecture", "Databases", "Behavioral"),\n'
            f'  "difficulty": "{difficulty}"\n'
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
                if isinstance(questions, list) and len(questions) > 0:
                    return questions[:count]
        except Exception as e:
            logger.error(f"OpenAI question generation failed: {e}. Using FallbackProvider.")

        return await FallbackProvider().generate_questions(role, experience, difficulty, interview_type, count, previous_questions)

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        speech_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await FallbackProvider().evaluate_answer(question, answer, role, experience, difficulty, interview_type, speech_metrics)

        import httpx
        metrics_str = json.dumps(speech_metrics) if speech_metrics else "None"
        prompt = (
            f"You are evaluating a candidate's answer for a {role} position ({experience} level, {difficulty} difficulty).\n"
            f"Question: {question}\n"
            f"Candidate Answer: {answer}\n"
            f"Speech Metrics: {metrics_str}\n\n"
            "Provide a rigorous evaluation. Return ONLY a valid JSON object with the following exact keys:\n"
            '{\n'
            '  "technicalScore": integer 0-100,\n'
            '  "relevanceScore": integer 0-100,\n'
            '  "clarityScore": integer 0-100,\n'
            '  "communicationScore": integer 0-100,\n'
            '  "confidenceScore": integer 0-100,\n'
            '  "overallScore": integer 0-100,\n'
            '  "feedback": "constructive 2-3 sentence feedback",\n'
            '  "strengths": ["strength 1", "strength 2"],\n'
            '  "improvements": ["improvement 1", "improvement 2"]\n'
            '}'
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                result = json.loads(content)
                if "overallScore" in result:
                    return result
        except Exception as e:
            logger.error(f"OpenAI evaluation failed: {e}. Using FallbackProvider.")

        return await FallbackProvider().evaluate_answer(question, answer, role, experience, difficulty, interview_type, speech_metrics)

    async def generate_hint(
        self,
        question: str,
        hint_level: int,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await FallbackProvider().generate_hint(question, hint_level, role, experience, difficulty, interview_type)

        import httpx
        prompt = (
            f"Question: '{question}' for a {role} ({experience}, {difficulty} {interview_type}).\n"
            f"Provide hint level {hint_level} of 5. Level 1 is high-level structure; level 5 is specific technical example/trade-off.\n"
            "Return ONLY a JSON object: {\"hint\": \"1-2 sentence concise actionable hint\", \"hint_level\": " + str(hint_level) + ", \"total_hints\": 5}"
        )
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5,
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                if "hint" in parsed:
                    return {"success": True, "hint": parsed["hint"], "hint_level": hint_level, "total_hints": 5}
        except Exception as e:
            logger.error(f"OpenAI hint generation failed: {e}")

        return await FallbackProvider().generate_hint(question, hint_level, role, experience, difficulty, interview_type)

    async def generate_ideal_answer(
        self,
        question: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await FallbackProvider().generate_ideal_answer(question, role, experience, difficulty, interview_type)

        import httpx
        prompt = (
            f"Generate an exemplary, structured answer for this {difficulty} {role} interview question:\n"
            f"Question: '{question}'\n"
            f"Interview Context: {interview_type}, Experience: {experience}.\n"
            "Return ONLY a JSON object: {\"ideal_answer\": \"clear, well-structured, professional 3-4 paragraph response\"}"
        )
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.4,
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                if "ideal_answer" in parsed:
                    return {"success": True, "ideal_answer": parsed["ideal_answer"]}
        except Exception as e:
            logger.error(f"OpenAI ideal answer generation failed: {e}")

        return await FallbackProvider().generate_ideal_answer(question, role, experience, difficulty, interview_type)



class GeminiProvider(AIProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.AI_API_KEY
        self.model = model or settings.AI_MODEL or "gemini-2.5-flash"

    async def generate_questions(
        self,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        count: int = 5,
        previous_questions: List[str] = None
    ) -> List[Dict[str, str]]:
        if not self.api_key:
            return await FallbackProvider().generate_questions(role, experience, difficulty, interview_type, count, previous_questions)

        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        previous_str = ", ".join([f'"{q}"' for q in (previous_questions or [])])
        prompt = (
            f"Generate exactly {count} distinct interview questions for a {difficulty} {interview_type} interview for a {role} ({experience} level).\n"
            f"Do not repeat these questions: [{previous_str}].\n"
            "Return ONLY a JSON array of objects with keys: 'text', 'category', 'difficulty'."
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
                resp.raise_for_status()
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                # Extract JSON codeblock if present
                clean_text = re.sub(r"```json|```", "", text).strip()
                parsed = json.loads(clean_text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed[:count]
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}. Using FallbackProvider.")

        return await FallbackProvider().generate_questions(role, experience, difficulty, interview_type, count, previous_questions)

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        speech_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await FallbackProvider().evaluate_answer(question, answer, role, experience, difficulty, interview_type, speech_metrics)

        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        prompt = (
            f"Evaluate answer for question: '{question}'\nCandidate answer: '{answer}'\nRole: {role}\n"
            "Return ONLY a JSON object with keys: technicalScore, relevanceScore, clarityScore, communicationScore, confidenceScore, overallScore, feedback, strengths, improvements."
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
                resp.raise_for_status()
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                clean_text = re.sub(r"```json|```", "", text).strip()
                result = json.loads(clean_text)
                if "overallScore" in result:
                    return result
        except Exception as e:
            logger.error(f"Gemini evaluation failed: {e}. Using FallbackProvider.")

        return await FallbackProvider().evaluate_answer(question, answer, role, experience, difficulty, interview_type, speech_metrics)


class FallbackProvider(AIProvider):
    async def generate_questions(
        self,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        count: int = 5,
        previous_questions: List[str] = None
    ) -> List[Dict[str, str]]:
        return get_fallback_questions(
            role=role,
            difficulty=difficulty,
            interview_type=interview_type,
            count=count,
            exclude_texts=previous_questions or []
        )

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str,
        speech_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Deterministic rule-based answer evaluator for fallback/demo mode.
        Evaluates length, key terms, speech metrics (if present) to generate realistic scores.
        """
        ans_clean = (answer or "").strip()
        ans_lower = ans_clean.lower()
        q_lower = (question or "").lower()
        word_count = len(ans_clean.split())

        # Extract keywords from question to check relevance
        q_words = [w for w in re.sub(r"[^\w\s]", "", q_lower).split() if len(w) > 3]
        matched_keywords = [w for w in q_words if w in ans_lower]
        keyword_match_ratio = len(matched_keywords) / max(1, len(q_words))

        # Base scores calculated dynamically from length and relevance
        if word_count < 10:
            tech_base = 52 + int(keyword_match_ratio * 20)
            clarity_base = 58
            relevance_base = 55 + int(keyword_match_ratio * 30)
        elif word_count < 30:
            tech_base = 70 + int(keyword_match_ratio * 18)
            clarity_base = 74
            relevance_base = 72 + int(keyword_match_ratio * 20)
        elif word_count < 80:
            tech_base = 80 + int(keyword_match_ratio * 15)
            clarity_base = 82
            relevance_base = 82 + int(keyword_match_ratio * 15)
        else:
            tech_base = 85 + int(keyword_match_ratio * 12)
            clarity_base = 86
            relevance_base = 88 + int(keyword_match_ratio * 10)

        # Topic-specific evaluation check (e.g., database indexing)
        if "index" in q_lower or "database" in q_lower:
            has_indexing_concept = any(k in ans_lower for k in ["index", "b-tree", "hash", "structure", "lookup", "scan", "table", "speed", "fast"])
            if has_indexing_concept:
                tech_base += 5
                relevance_base += 5

        # Adjust communication & confidence based on speech metrics if available
        comm_score = 80
        conf_score = 78
        if speech_metrics:
            filler_rate = speech_metrics.get("filler_rate", 0.0)
            wpm = speech_metrics.get("words_per_minute", 140.0)

            if filler_rate > 0.05:
                comm_score -= 10
            elif filler_rate < 0.02:
                comm_score += 5

            if 120 <= wpm <= 170:
                conf_score += 6
            elif wpm < 90 or wpm > 200:
                conf_score -= 8

        overall = int(round((tech_base + relevance_base + clarity_base + comm_score + conf_score) / 5.0))

        strengths = []
        improvements = []

        if keyword_match_ratio > 0.3 or "index" in ans_lower:
            strengths.append("Directly addressed key technical concepts of the question")
        if word_count >= 20:
            strengths.append("Provided a structured explanation with sufficient detail")
        if not strengths:
            strengths.append("Attempted to respond to the prompt")

        if word_count < 30:
            improvements.append("Elaborate further with concrete technical mechanisms and trade-offs")
        if speech_metrics and speech_metrics.get("filler_words", 0) > 3:
            improvements.append("Reduce filler words (e.g. 'um', 'like', 'basically') to sound more polished")
        if not improvements:
            improvements.append("Consider detailing edge cases or architectural impact under high load")

        feedback_topic = question[:50].strip()
        feedback = (
            f"Your explanation addressed '{feedback_topic}...'. "
            f"The candidate demonstrated good {role} baseline knowledge. "
            "To maximize impact, ensure key architectural trade-offs are explicitly outlined."
        )

        return {
            "technicalScore": min(100, max(0, tech_base)),
            "relevanceScore": min(100, max(0, relevance_base)),
            "clarityScore": min(100, max(0, clarity_base)),
            "communicationScore": min(100, max(0, comm_score)),
            "confidenceScore": min(100, max(0, conf_score)),
            "overallScore": min(100, max(0, overall)),
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements
        }

    async def generate_hint(
        self,
        question: str,
        hint_level: int,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        """Generate progressive, question-specific hints for fallback/demo mode."""
        q_lower = question.lower()

        # Dynamic progressive hint library based on question topic & level
        if "supervised" in q_lower or "unsupervised" in q_lower or "learning" in q_lower:
            hints = [
                "Start by defining what machine learning means in the context of training models on data.",
                "Explain how supervised learning relies on labeled input-output pairs to train predictions.",
                "Explain how unsupervised learning discovers hidden patterns or clusters in unlabeled data.",
                "Give one practical example of each (e.g. spam detection vs customer segmentation).",
                "Finish by summarizing key trade-offs in data requirements and computational complexity."
            ]
        elif "database" in q_lower or "index" in q_lower or "sql" in q_lower:
            hints = [
                "Start by explaining the purpose of database indexing in accelerating data retrieval.",
                "Describe how data structures like B-Trees or Hash Indexes reduce scan overhead.",
                "Explain the trade-off: faster read queries vs write/update overhead.",
                "Give an example of indexing primary key lookups versus full table scans.",
                "Conclude with best practices on composite keys and indexing high-cardinality columns."
            ]
        elif "microservice" in q_lower or "architecture" in q_lower or "system" in q_lower:
            hints = [
                "Begin by outlining the core architectural requirements for scalable backend systems.",
                "Discuss decoupling services, API gateways, and asynchronous event messaging.",
                "Highlight key challenges: data consistency, distributed tracing, and service discovery.",
                "Provide a real-world scenario (e.g. order processing vs inventory service).",
                "Wrap up with strategies for handling network partitions and circuit breaking."
            ]
        elif "react" in q_lower or "component" in q_lower or "frontend" in q_lower or "state" in q_lower:
            hints = [
                "Start by defining component state management and virtual DOM rendering principles.",
                "Explain how props pass data top-down while state handles localized interactivity.",
                "Discuss state lifting, context API, or state libraries for global data flow.",
                "Give an example of minimizing unnecessary re-renders with memoization.",
                "Conclude with performance optimization guidelines for large-scale web applications."
            ]
        else:
            # General progressive hint template tailored to question
            clean_q = question.strip().rstrip("?")
            hints = [
                f"Start by defining the core scope and background context of: '{clean_q}'.",
                f"Identify the 2-3 primary technical principles involved in solving this problem.",
                f"Break down the step-by-step methodology or architectural approach you would adopt.",
                f"Provide a concrete scenario or trade-off analysis relevant to a {role} ({experience} level).",
                f"Conclude by summarizing the expected business or system impact of your solution."
            ]

        # Clamp hint level 1..5
        lvl = max(1, min(5, hint_level))
        selected_hint = hints[lvl - 1]

        return {
            "success": True,
            "hint": selected_hint,
            "hint_level": lvl,
            "total_hints": 5
        }

    async def generate_ideal_answer(
        self,
        question: str,
        role: str,
        experience: str,
        difficulty: str,
        interview_type: str
    ) -> Dict[str, Any]:
        """Generate structured ideal answer for fallback/demo mode."""
        clean_q = question.strip().rstrip("?")

        ideal_answer = (
            f"To approach '{clean_q}' effectively as a {experience} {role} ({difficulty} {interview_type} level):\n\n"
            "1. **Core Concept & Definition**: Begin by providing a clear, concise definition of the topic. Frame the problem in terms of scalability, efficiency, and reliability.\n\n"
            "2. **Technical Architecture / Strategy**: Detail the step-by-step implementation. Mention appropriate design patterns, data structures, algorithms, or framework mechanisms required.\n\n"
            "3. **Trade-offs & Edge Cases**: Highlight critical trade-offs (e.g., latency vs throughput, memory vs compute, simplicity vs extensibility) and how you handle failure scenarios or edge cases.\n\n"
            "4. **Practical Example & Conclusion**: Conclude with a real-world scenario demonstrating impact, metrics, and best practices."
        )

        return {
            "success": True,
            "ideal_answer": ideal_answer
        }



def get_ai_provider() -> AIProvider:
    provider = settings.AI_PROVIDER.lower()
    if settings.DEMO_MODE:
        return FallbackProvider()

    if provider == "openai" and settings.AI_API_KEY:
        return OpenAIProvider(api_key=settings.AI_API_KEY, model=settings.AI_MODEL)
    elif provider == "gemini" and settings.AI_API_KEY:
        return GeminiProvider(api_key=settings.AI_API_KEY, model=settings.AI_MODEL)
    else:
        return FallbackProvider()
