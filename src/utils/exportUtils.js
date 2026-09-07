/**
 * Exports data to a CSV file and triggers a download.
 * @param {Array<string>} headers - The headers for the CSV.
 * @param {Array<Array<any>>} rows - The rows of data.
 * @param {string} filename - The name of the file to download.
 */
export const exportToCSV = (headers, rows, filename) => {
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
