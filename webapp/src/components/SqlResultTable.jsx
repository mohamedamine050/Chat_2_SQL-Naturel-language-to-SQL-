import React from 'react';

const SqlResultTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="response-text">No results.</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="table-container">
      <table className="results-table">
        <thead className="table-header">
          <tr>
            {headers.map((header) => (
              <th key={header} className="table-header-cell">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="table-row">
              {headers.map((field) => (
                <td key={field} className="table-cell">
                  {field === 'image_url' && row[field] ? (
                    <img
                      src={row[field]}
                      alt={row.name || 'image'}
                      className="table-image"
                      style={{ maxWidth: '80px', maxHeight: '80px' }}
                    />
                  ) : row[field] === null || row[field] === undefined ? (
                    <span className="table-cell-null">null</span>
                  ) : (
                    String(row[field])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SqlResultTable;
