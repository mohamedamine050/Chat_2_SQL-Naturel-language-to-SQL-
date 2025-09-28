def clean_sql_query(query: str) -> str:
    if query.startswith("```") and query.endswith("```"):
        lines = query.split("\n")
        if lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines[-1].strip() == "```":
            lines = lines[:-1]
        query = "\n".join(lines)
    return query.strip()
