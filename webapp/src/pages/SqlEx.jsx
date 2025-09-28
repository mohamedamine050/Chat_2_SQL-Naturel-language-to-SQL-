import React, { useState } from 'react';
import Sidebar from '../components/SideBar';
import { executeSqlQuery } from '../services/api';
import SqlResultTable from '../components/SqlResultTable';
import { Play, Download, AlertCircle, Loader2 } from 'lucide-react';

const SqlEx = () => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState(null);
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);

  const handleExecute = async () => {
    if (!sqlQuery.trim()) return;
    
    setError('');
    setSqlResult(null);
    setIsExecuting(true);
    
    try {
      const result = await executeSqlQuery(sqlQuery);
      if (result.status === 'success') {
        setSqlResult(result.data);
        // Add to query history
        setQueryHistory(prev => [sqlQuery, ...prev].slice(0, 5));
      } else {
        setError(result.message || 'Error executing query');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExport = () => {
    if (!sqlResult) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    if (sqlResult.length > 0) {
      csvContent += Object.keys(sqlResult[0]).join(",") + "\r\n";
    }
    
    // Add data rows
    sqlResult.forEach(row => {
      csvContent += Object.values(row).join(",") + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "query_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sql-editor-layout">
      <Sidebar />
      
      <div className="sql-editor-container">
        <div className="editor-header">
          <h2 className="editor-title">SQL Query Editor</h2>
          {queryHistory.length > 0 && (
            <div className="query-history">
              <h4>Recent Queries:</h4>
              <ul>
                {queryHistory.map((query, index) => (
                  <li key={index} onClick={() => setSqlQuery(query)}>
                    {query.length > 50 ? `${query.substring(0, 50)}...` : query}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="sql-input-container">
          <textarea
            className="sql-textarea"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            spellCheck="false"
          />
          <div className="editor-actions">
            <button 
              className="btn-execute"
              onClick={handleExecute}
              disabled={isExecuting || !sqlQuery.trim()}
            >
              {isExecuting ? (
                <Loader2 className="spin-icon" size={18} />
              ) : (
                <Play size={18} />
              )}
              Execute
            </button>
            <button 
              className="btn-export"
              onClick={handleExport}
              disabled={!sqlResult || sqlResult.length === 0}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="results-container">
          {sqlResult ? (
            Array.isArray(sqlResult) && sqlResult.length > 0 ? (
              <>
                <div className="results-header">
                  <h3>Query Results ({sqlResult.length} rows)</h3>
                  <div className="result-stats">
                    {sqlResult.length > 0 && (
                      <span>Columns: {Object.keys(sqlResult[0]).length}</span>
                    )}
                  </div>
                </div>
                <div className="result-table-wrapper">
                  <SqlResultTable data={sqlResult} />
                </div>
              </>
            ) : (
              <div className="no-results">
                Query executed successfully but returned no tabular results
              </div>
            )
          ) : (
            <div className="empty-state">
              <p>Enter a SQL query and click "Execute" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SqlEx;