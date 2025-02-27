import { Table } from 'lucide-react';

interface DataTableProps {
  headers: string[];
  rows: string[][];
}

export function DataTable({ headers, rows }: DataTableProps) {
  // Helper function to check if string is a valid URL
  const isValidUrl = (urlString: string): boolean => {
    try {
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        return false;
      }
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Helper function to render cell content
  const renderCell = (content: string) => {
    if (isValidUrl(content)) {
      return (
        <a 
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {new URL(content).hostname}
        </a>
      );
    }
    return content;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIdx) => (
                <td 
                  key={`${rowIdx}-${cellIdx}`}
                  className="px-4 py-3 text-sm text-gray-900 whitespace-normal break-words"
                >
                  {cell.includes(',') 
                    ? cell.split(',').map((item, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {renderCell(item.trim())}
                        </span>
                      ))
                    : renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}