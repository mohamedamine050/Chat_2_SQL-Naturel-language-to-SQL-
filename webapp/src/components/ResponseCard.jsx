import React from "react";
import { Database, MessageCircle, HelpCircle } from "lucide-react";

const ResponseCard = ({ response, isLastInGroup }) => {
  if (!response) return null;

  // Destructure with proper validation
  const {
    question,
    timestamp,
    intent = "general_chat",
    query,
    summary,
    result,
    message
  } = response;

  const getIntentIcon = (intent) => {
    switch (intent) {
      case "sql_request": return <Database className="intent-icon" />;
      case "general_chat": return <MessageCircle className="intent-icon" />;
      case "unclear": return <HelpCircle className="intent-icon" />;
      default: return <MessageCircle className="intent-icon" />;
    }
  };

  const getIntentClass = (intent) => {
    switch (intent) {
      case "sql_request": return "sql-request";
      case "general_chat": return "general-chat";
      case "unclear": return "unclear";
      default: return "general-chat";
    }
  };

  const formatMessageContent = (content) => {
    if (content === null || content === undefined) return null;
    
    if (typeof content === 'string') {
      const cleaned = content.replace(/^"(.*)"$/, '$1').trim();
      return cleaned || null;
    }
    
    return JSON.stringify(content, null, 2);
  };

  const formatRawResult = (result) => {
    if (!result) return <div className="response-text">No data</div>;

    const dataArray = Array.isArray(result) ? result : result?.data;

    if (Array.isArray(dataArray)) {
      if (dataArray.length === 0) return <div className="response-text">No results found</div>;
      
      return (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                {Object.keys(dataArray[0] || {}).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataArray.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>
                      {val == null ? (
                        <span className="null-value">null</span>
                      ) : (
                        String(val)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <pre className="code-block">{JSON.stringify(result, null, 2)}</pre>;
  };

  // Don't render if we have no content to display
  const hasContent = question || message || query || summary || result;
  if (!hasContent) return null;

  return (
    <div className={`response-container ${isLastInGroup ? 'last-in-group' : ''}`}>
      {/* Only show user message if it's a user message type */}
      {response.type === 'user' && question && (
        <div className="user-message">
          <div className="message-content">
            <strong>You:</strong> {question}
          </div>
          {timestamp && <div className="message-timestamp">{timestamp}</div>}
        </div>
      )}

      {/* Only show assistant response if it's a bot message type */}
      {response.type === 'bot' && (
        <>
          {/* Intent badge */}
          <div className={`intent-badge ${getIntentClass(intent)}`}>
            {getIntentIcon(intent)}
            <span>{intent.replace(/_/g, " ")}</span>
          </div>

          {/* Response content */}
          {intent === "sql_request" ? (
            <>
              {query && (
                <div className="response-section">
                  <h3 className="section-title">
                    <Database className="icon sql" /> Generated SQL Query
                  </h3>
                  <pre className="code-block sql">{query}</pre>
                </div>
              )}

              {summary && (
                <div className="response-section">
                  <h3 className="section-title">Summary</h3>
                  <p className="response-text">{summary}</p>
                </div>
              )}

              {result && (
                <div className="response-section">
                  <h3 className="section-title">Query Results</h3>
                  {formatRawResult(result)}
                </div>
              )}
            </>
          ) : (
            message && (
              <div className="response-section">
                <h3 className="section-title">
                  {getIntentIcon(intent)} Assistant Response
                </h3>
                <p className="response-text">
                  {formatMessageContent(message) || "No response message."}
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ResponseCard;