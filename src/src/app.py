from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import pprint

from db import connect_to_db, get_mysql_schema, execute_sql
from llm import (
    chain,
    clean_sql_query,
    rephrase_result_with_llm,
    classify_sql_intent,
    chat_with_memory,
    memory,
)

# Load environment variables
load_dotenv()

# LangSmith config (doit être configuré dans config.py)
from config import langsmith_api_key, langsmith_project
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = langsmith_project
os.environ["LANGCHAIN_API_KEY"] = langsmith_api_key
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"

# Initialize Flask app
app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "✅ Gemini SQL Chat API is running!"

@app.route("/affiche_schema", methods=["GET"])
def affiche_schema():
    try:
        schema = get_mysql_schema()
        print("📦 Schema fetched successfully.")
        return jsonify(schema)
    except Exception as e:
        print(f"❌ Error fetching schema: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/execute-sql", methods=["POST"])
def execute_sql_endpoint():
    try:
        data = request.get_json()
        query = data.get("query") if data else None

        if not query or not query.strip():
            return jsonify({"status": "error", "message": "No SQL query provided"}), 400

        result = execute_sql(query)

        if result.get("status") == "error":
            return jsonify(result), 500

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/connect_db", methods=["POST"])
def connect_db():
    data = request.get_json()

    db_name = data.get("db_name")
    db_password = data.get("db_password")
    db_user = data.get("db_user")
    db_host = data.get("db_host")
    db_port = data.get("db_port", 3306)  # MySQL default port

    if not all([db_name, db_password, db_user, db_host]):
        return jsonify({"error": "Missing database connection parameters"}), 400

    connection = connect_to_db(db_name, db_password, db_user, db_host, db_port)

    if connection:
        connection.close()  # Close immediately since it's just a test
        return jsonify({"message": "Connected to database successfully"}), 200
    else:
        return jsonify({"error": "Failed to connect to database"}), 500

@app.route("/query", methods=["POST"])
def query_handler():
    data = request.get_json()
    user_input = data.get("question", "").strip()

    if not user_input:
        return jsonify({"error": "No question provided"}), 400

    try:
        # Step 1: Classify user intent
        intent = classify_sql_intent(user_input)
        print(f"[Intent] '{user_input}' → {intent}")

        if intent == "sql_request":
            # Load schema and conversation history
            schema = get_mysql_schema()
            history_str = memory.load_memory_variables({}).get("history", "")

            # Format tables info as string to pass to prompt
            tables_str = "\n".join(
                f"{table['name']}: {', '.join(table['columns'])}"
                for table in schema["tables"]
            )

            # Step 2: Generate SQL query using the chain
            sql_query = chain.invoke(
                {
                    "question": user_input,
                    "history": history_str,
                    "tables": tables_str  # ⚠️ Must provide tables here!
                },
                config={"run_name": "Gemini_SQL_Query"}
            )
            sql_query = clean_sql_query(sql_query)
            print("\nGenerated SQL:\n", sql_query)

            if "error" in sql_query.lower() or not sql_query.strip():
                return jsonify({"error": "Failed to generate a valid SQL query"}), 500

            # Step 3: Execute generated SQL query
            sql_result = execute_sql(sql_query)
            print("\nSQL Result:")
            pprint.pprint(sql_result)

            # Step 4: Rephrase result for user-friendly summary
            summary = rephrase_result_with_llm(sql_result, user_input)

            # Step 5: Update memory
            memory.chat_memory.add_user_message(user_input)
            memory.chat_memory.add_ai_message(summary)

            return jsonify({
                "intent": intent,
                "question": user_input,
                "query": sql_query,
                "result": sql_result,
                "summary": summary
            })

        elif intent == "general_chat":
            response = chat_with_memory(user_input)
            print(f"Chat response: {response}")
            return jsonify({
                "intent": intent,
                "question": user_input,
                "message": response["message"]
            })

        elif intent == "unclear":
            return jsonify({
                "intent": intent,
                "question": user_input,
                "message": "🤔 I'm not sure what you're asking. Could you rephrase or provide more context?"
            })

        else:
            return jsonify({
                "intent": "unknown",
                "question": user_input,
                "message": "❓ Sorry, I couldn't understand your request."
            })

    except Exception as e:
        print(f"Error in /query: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
