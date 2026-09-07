/**
 * Formats a numeric value as currency using the correct ISO currency code.
 * Accepts either an ISO 4217 code (EUR, USD, GBP…) or a legacy symbol ($, €).
 * Falls back to USD when the value is not a recognised ISO code.
 */
export const formatCurrency = (value, currency = 'USD') => {
    if (value === undefined || value === null) value = 0;
    const num = Number(value);

    // Map legacy symbol prefixes → ISO codes
    const symbolMap = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR' };
    const iso = symbolMap[currency] ?? (currency?.length === 3 ? currency.toUpperCase() : 'USD');

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: iso,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    } catch {
        // Fallback for unknown currency codes
        return `${currency}${num.toFixed(2)}`;
    }
};

/**
 * Formats a date string into a more readable format (e.g., MM-DD).
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string.
 */
export const formatDateShort = (dateString) => {
    if (!dateString) return '';
    // Assumes YYYY-MM-DD format and returns MM-DD
    return dateString.slice(5);
};

/**
 * Formats a date string into a localized date string.
 * @param {string} dateString - The date string to format.
 * @returns {string} The localized date string.
 */
export const formatDateLocale = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
};

/**
 * Formats a date into a Month Year format (e.g., Jan 2024).
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted month/year string.
 */
export const formatMonthYear = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

/**
 * Sorts an array of organization members.
 * Pins the current user to the top, then admins/owners, then by name.
 * @param {Array} members - The array of members to sort.
 * @param {Object} currentUser - The current authenticated user object.
 * @returns {Array} The sorted array of members.
 */
export const sortMembers = (members, currentUser) => {
    return [...members].sort((a, b) => {
        if (a.userId === currentUser?.id) return -1;
        if (b.userId === currentUser?.id) return 1;

        const isAAdmin = a.role === 'admin' || a.role === 'owner';
        const isBAdmin = b.role === 'admin' || b.role === 'owner';
        if (isAAdmin && !isBAdmin) return -1;
        if (!isAAdmin && isBAdmin) return 1;

        return (a.fullName || '').localeCompare(b.fullName || '');
    });
};
