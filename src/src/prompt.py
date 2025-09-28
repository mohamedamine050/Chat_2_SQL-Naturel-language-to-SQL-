from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts.example_selector import SemanticSimilarityExampleSelector
from langchain.prompts.few_shot import FewShotPromptTemplate
from langchain_core.prompts import PromptTemplate
import google.generativeai as genai

__all__ = ['PROMPT_TEMPLATE', 'genai']

# ──────────────────────────────────────────────────────────────
# 1. EXAMPLES
examples = [
    {"question": "List all products with a stock quantity less than 50.",
     "query": "SELECT name, stock_quantity FROM products WHERE stock_quantity < 50;"},
    {"question": "Show the name and price of all products in the 'Electronics' category.",
     "query": "SELECT p.name, p.price FROM products p JOIN categories c ON p.category_id = c.id WHERE c.name = 'Electronics';"},
    {"question": "Get the total number of completed sales transactions.",
     "query": "SELECT COUNT(*) FROM transactions WHERE status = 'COMPLETED' AND transaction_type = 'SALE';"},
    {"question": "Find all suppliers located in 'Tunis'.",
     "query": "SELECT * FROM suppliers WHERE address LIKE '%Tunis%';"},
    {"question": "Get the name and email of all users with role 'ADMIN'.",
     "query": "SELECT name, email FROM users WHERE role = 'ADMIN';"},
    {"question": "Show the most expensive product.",
     "query": "SELECT * FROM products ORDER BY price DESC LIMIT 1;"},
    {"question": "How many products have expired?",
     "query": "SELECT COUNT(*) FROM products WHERE expiry_date < CURRENT_DATE;"}
]

# ──────────────────────────────────────────────────────────────
# 2. EMBEDDINGS + SELECTOR
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

example_selector = SemanticSimilarityExampleSelector.from_examples(
    examples=examples,
    embeddings=embeddings,
    vectorstore_cls=Chroma,
    k=3,
    input_keys=["question"],
)

# ──────────────────────────────────────────────────────────────
# 3. EXAMPLE PROMPT TEMPLATE
example_prompt = PromptTemplate(
    input_variables=["question", "query"],
    template="Question:\n{question}\nSQL:\n{query}\n"
)

# ──────────────────────────────────────────────────────────────
# 4. FINAL FEW-SHOT PROMPT TEMPLATE (DYNAMIQUE)
PROMPT_TEMPLATE = FewShotPromptTemplate(
    example_selector=example_selector,
    example_prompt=example_prompt,
    prefix="""
You are an expert SQL generator. Based on the MySQL schema, conversation history, and examples provided, convert the user's natural language question into a valid SQL query.

MySQL Schema:
{tables}

Instructions:
- Use correct table and column names.
- Use JOINs when needed.
- Use WHERE clauses when filtering.
- Respond only with the SQL query.

Conversation history:
{history}

Few-shot examples:
""",
    suffix="Now, convert the following question:\nQuestion:\n{question}\nSQL:",
    input_variables=["history", "question", "tables"]
)
