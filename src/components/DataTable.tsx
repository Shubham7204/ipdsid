import { Table } from 'lucide-react';

interface DataTableProps {
  title: string;
  headers: string[];
  rows: string[][];
}

export function DataTable({ title, headers, rows }: DataTableProps) {
  return (
    <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3 mb-6">
        <Table size={24} className="text-blue-600" />
        <h2 className="text-2xl font-black text-blue-600">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-4 border-black rounded-lg">
          <thead>
            <tr className="bg-blue-600 text-white">
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-black border-b-2 border-black"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y-2 divide-black">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-blue-50 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 text-sm border-r-2 border-black last:border-r-0"
                  >
                    {cell.startsWith('http') ? (
                      <div className="flex flex-wrap gap-2">
                        {cell.split(',').map((url, i) => (
                          <a
                            key={i}
                            href={url.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-50 px-3 py-1 rounded-lg border-2 border-black text-blue-600 hover:bg-blue-100 font-bold"
                          >
                            {new URL(url.trim()).hostname.replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    ) : cell.includes(',') ? (
                      <div className="flex flex-wrap gap-2">
                        {cell.split(',').map((item, i) => (
                          <span
                            key={i}
                            className="inline-block bg-blue-50 px-3 py-1 rounded-lg border-2 border-black"
                          >
                            {item.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}