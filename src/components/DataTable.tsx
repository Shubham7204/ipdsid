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
          className="inline-block bg-blue-50 px-2 py-1 rounded-md border-2 border-black text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)]"
        >
          {new URL(content).hostname}
        </a>
      );
    }
    return (
      <span className="inline-block bg-gray-50 px-2 py-1 rounded-md border-2 border-black text-xs font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]">
        {content}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
      <table className="min-w-full">
        <thead>
          <tr className="bg-blue-600 text-white border-b-4 border-black">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y-2 divide-black">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-blue-50 transition-colors">
              {row.map((cell, cellIdx) => (
                <td 
                  key={`${rowIdx}-${cellIdx}`}
                  className="px-4 py-3 text-sm whitespace-normal break-words"
                >
                  <div className="flex flex-wrap gap-2">
                    {cell.includes(',') 
                      ? cell.split(',').map((item, i) => (
                          <span key={i}>
                            {renderCell(item.trim())}
                          </span>
                        ))
                      : renderCell(cell)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}