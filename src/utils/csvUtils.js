export const parseCsvTable = (text) => {
    if (!text) return [];

    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                value += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(value);
            value = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i += 1;
            }

            row.push(value);
            value = '';

            const hasVisibleValue = row.some((cell) => cell.trim() !== '');
            if (hasVisibleValue) {
                rows.push(row);
            }

            row = [];
            continue;
        }

        value += char;
    }

    if (value.length > 0 || row.length > 0) {
        row.push(value);
        const hasVisibleValue = row.some((cell) => cell.trim() !== '');
        if (hasVisibleValue) {
            rows.push(row);
        }
    }

    return rows;
};
