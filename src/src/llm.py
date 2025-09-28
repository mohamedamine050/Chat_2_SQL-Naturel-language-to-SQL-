from config import genai
from prompt import PROMPT_TEMPLATE
from langsmith import traceable
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import StrOutputParser

from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate

# ──────────────────────────────────────────────────────────────
# Gemini Model Initialization
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ──────────────────────────────────────────────────────────────
# SQL Query Generation
@traceable(name="Gemini SQL Generation")
def gemini_predict(prompt_input, **kwargs):  # Accept arbitrary kwargs
    if isinstance(prompt_input, tuple):
        prompt_input = prompt_input[1]
    elif not isinstance(prompt_input, str):
        prompt_input = str(prompt_input)

    response = gemini_model.generate_content(prompt_input)

    if hasattr(response, "text") and response.text:
        return response.text.strip()
    elif hasattr(response, "candidates"):
        parts = response.candidates[0].content.parts
        if parts and hasattr(parts[0], "text"):
            return parts[0].text.strip()

    return "No valid text found in Gemini response."

# ──────────────────────────────────────────────────────────────
# Chain for generating SQL from prompt
chain = PROMPT_TEMPLATE | RunnableLambda(gemini_predict) | StrOutputParser()

# ──────────────────────────────────────────────────────────────
# Clean SQL (optional formatting fix)
def clean_sql_query(query: str) -> str:
    if query.startswith("```") and query.endswith("```"):
        lines = query.split("\n")
        if lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines[-1].strip() == "```":
            lines = lines[:-1]
        query = "\n".join(lines)
    return query.strip()

# ──────────────────────────────────────────────────────────────
# Rephrase SQL Result to Friendly Summary
@traceable(name="Rephrase SQL Result")
def rephrase_result_with_llm(raw_result, original_question):
    prompt_rephrase = f"""
You are a professional assistant with a friendly tone. Based on the user's question and the SQL query result, generate a summary that is:

- Clear and accurate
- Easy to understand
- Friendly yet professional in tone

Avoid overly technical terms. Speak like a helpful expert explaining to a smart non-technical colleague.

User question: "{original_question}"

SQL query result:
{raw_result}

Professional and friendly summary:
"""
    try:
        response = gemini_model.generate_content(prompt_rephrase)
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        elif hasattr(response, "candidates"):
            parts = response.candidates[0].content.parts
            if parts and hasattr(parts[0], "text"):
                return parts[0].text.strip()
        return "Sorry, I couldn’t generate a clear explanation."
    except Exception as e:
        return f"Error during rephrasing: {e}"

# ──────────────────────────────────────────────────────────────
# Memory-enabled Chat Prompt
# NOTE: Changed input variable from "input" to "question" to match your PROMPT_TEMPLATE
CHAT_PROMPT = PromptTemplate(
    input_variables=["history", "question"],
    template="""
You are a helpful assistant having a conversation with a user.

Conversation history:
{history}

User: {question}
Assistant:"""
)

# ──────────────────────────────────────────────────────────────
# Memory setup
memory = ConversationBufferMemory(return_messages=True)

chat_chain = LLMChain(
    llm=RunnableLambda(gemini_predict),
    prompt=CHAT_PROMPT,
    memory=memory,
    output_parser=StrOutputParser()
)

# ──────────────────────────────────────────────────────────────
# Intent Classification Prompt — LLM Powered
INTENT_PROMPT_TEMPLATE = """
You are an AI assistant that classifies whether a user's message should be handled with a SQL query or not.

Classify the message into one of these categories:

- sql_request → if the user clearly asks for structured data from a database (counts, filters, lists, totals, groupings).
- general_chat → greetings, thanks, chitchat, questions about you, jokes, etc.
- unclear → extremely vague or meaningless (e.g., "asdf", "?", "123")

⚠️ Short valid questions like "how many users" or "list orders" ARE sql_request.

Respond with one of the following words only:
sql_request
general_chat
unclear

User: "{message}"
Intent:
"""

# ──────────────────────────────────────────────────────────────
# Gemini-powered Intent Classifier
def classify_sql_intent(message: str) -> str:
    prompt = INTENT_PROMPT_TEMPLATE.format(message=message.strip())
    try:
        response = gemini_model.generate_content(prompt)
        if hasattr(response, "text") and response.text:
            return response.text.strip().lower()
        elif hasattr(response, "candidates"):
            parts = response.candidates[0].content.parts
            if parts and hasattr(parts[0], "text"):
                return parts[0].text.strip().lower()
        return "unclear"
    except Exception as e:
        print(f"Intent classification error: {e}")
        return "unclear"

# ──────────────────────────────────────────────────────────────
# Final Chat Function with Intent Routing (NO hardcoded filters)
def chat_with_memory(user_input):
    cleaned = user_input.strip()
    intent = classify_sql_intent(cleaned)
    print(f"[INTENT] '{cleaned}' → {intent}")

    if intent == "sql_request":
        # SQL queries handled by your SQL route or chain elsewhere
        return {
            "intent": intent,
            "message": "Handled by SQL route"
        }

    elif intent == "general_chat":
        # Pass input to memory-enabled chat chain with history
        reply = chat_chain.run(question=cleaned)
        return {
            "intent": intent,
            "message": reply
        }

    elif intent == "unclear":
        return {
            "intent": intent,
            "message": "🤔 I'm not sure what you're asking. Could you rephrase your question or be a bit more specific?"
        }

    else:
        return {
            "intent": "unknown",
            "message": "❓ Hmm, I couldn’t quite understand that. Can you try again?"
        }
