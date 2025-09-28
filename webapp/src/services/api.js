// src/services/api.js

export async function fetchQueryResponse(question) {
  const res = await fetch("http://localhost:5000/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error("Server error");
  }

  return res.json();
}

export const testDbConnection = async (connectionParams) => {
  try {
    const response = await fetch("http://localhost:5000/connect_db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(connectionParams),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to connect");
    return data;
  } catch (error) {
    throw error;
  }
};

export const queryDb = async (payload) => {
  try {
    const response = await fetch("http://localhost:5000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // { question, db_name, db_password, ... }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Query failed");
    return data;
  } catch (error) {
    throw error;
  }
};

// ✅ NEW
export const executeSqlQuery = async (sqlQuery) => {
  try {
    const response = await fetch("http://localhost:5000/execute-sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sqlQuery }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "SQL execution failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};
export async function fetchSchema() {
  const res = await fetch("http://localhost:5000/affiche_schema");
  if (!res.ok) throw new Error("Failed to fetch schema");
  return res.json();  // returns { tables: [...] }
}
