const API_BASE_URL = "https://server-patient-meadow-2191.fly.dev"; // Ensure this matches your backend port
// const API_BASE_URL = process.env.VITE_APP_API_URL;
// const API_BASE_URL = "http://localhost:3000";

/**
 * Formats a number with comma separation for the 'vi-VN' locale.
 * @param {number|string} num The number to format.
 * @param {number} [decimalPlaces=0] The number of decimal places to display.
 * @returns {string} The formatted number string, or an empty string if input is invalid.
 */
export const formatNumberWithCommas = (num, decimalPlaces = 0) => {
    if (num === null || num === undefined || isNaN(parseFloat(num))) {
        return '';
    }
    const floatNum = parseFloat(num);
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces,
        useGrouping: true, // This enables comma separation
    }).format(floatNum);
};

/**
 * Returns the plural form of a singular English word for unit measures,
 * assuming only 's' or 'es' pluralization rules apply.
 * @param {string} singularWord The singular form of the unit (e.g., 'box', 'gram', 'piece').
 * @returns {string} The plural form (e.g., 'boxes', 'grams', 'pieces').
 */
export const getPluralForm = (singularWord) => {
    // Convert to lowercase for consistent matching of endings
    const lowerCaseWord = singularWord.toLowerCase();

    // Rule: Add 'es' for words ending in s, x, z, ch, sh
    if (lowerCaseWord.endsWith('s') ||
        lowerCaseWord.endsWith('x') ||
        lowerCaseWord.endsWith('z') ||
        lowerCaseWord.endsWith('ch') ||
        lowerCaseWord.endsWith('sh'))
    {
        return singularWord + 'es';
    }

    // Default rule: Add 's' for all other cases
    return singularWord + 's';
};

/**
 * Formats a quantity with appropriate singular/plural units dynamically.
 * @param {number} quantity The numerical value.
 * @param {string} unit1BaseSingular The singular base form of the first unit (e.g., 'gram', 'piece').
 * @param {string} unit2BaseSingular The singular base form of the second unit (e.g., 'box', 'litre').
 * @returns {string} The formatted string, e.g., "1 gram/box" or "10 grams/litres".
 */
export const formatQuantityWithUnitsDynamic = (quantity, unitBaseSingular) => {

    const formattedQuantity = formatNumberWithCommas(quantity);

    // Determine if the quantity implies singular or plural units
    const isSingular = Math.abs(parseFloat(quantity)) === 1;

    // Get the correct form for the first unit
    const unit = isSingular ? unitBaseSingular : getPluralForm(unitBaseSingular);

    // Handle cases where the quantity formatter returns an empty string (invalid input)
    if (formattedQuantity === '') {
        return '';
    }

    return `${formattedQuantity} ${unit}`;    
};

export const formatNumberOfBoxes = (quantity, categoryID, unitOfMeasure, unitBaseSingular = 'box') => {
    // console.log(quantity, typeof quantity);
    const allowedCategoryIds = [1, 2, 3, 4];
    const requiredUnit = "gram";
    const formattedQuantity = formatNumberWithCommas(quantity, 1);
    const isSingular = Math.abs(parseFloat(quantity)) === 1;
    const unit = isSingular ? unitBaseSingular : getPluralForm(unitBaseSingular);
    // console.log(formattedQuantity, typeof formattedQuantity, );

    if (Boolean(quantity) && allowedCategoryIds.includes(categoryID) && unitOfMeasure === requiredUnit) {
        return `${formattedQuantity} ${unit}`;  
    } 
    return;
}

/**
 * Formats a number as currency in 'VND' for the 'vi-VN' locale.
 * @param {number|string} num The number to format.
 * @returns {string} The formatted currency string, or a default string like '0 VND' if input is invalid.
 */
export const formatCurrency = (num) => {
    if (num === null || num === undefined || isNaN(parseFloat(num))) {
        return '0 VND'; // Default for invalid currency numbers
    }
    const floatNum = parseFloat(num);
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0, // VND typically doesn't use decimals for whole numbers
        maximumFractionDigits: 0,
        useGrouping: true,
    }).format(floatNum);
};

/**
 * Extracts the gram weight per box from a product name.
 * Assumes the format is 'ProductName[NUMBER]G', e.g., 'XYZ50G'.
 * Returns null if no number is found, indicating no specific box size is defined.
 * @param {string} productName The name of the product (e.g., "XYZ50G").
 * @returns {number|null} The gram weight per box (e.g., 50), or null if not found.
 */
// export const getGramsPerBoxFromName = (productName) => {
//     if (!productName) return null;
//     const match = productName.match(/(\d+)G$/i); // Matches digits followed by 'G' at the end of the string
//     return match ? parseFloat(match[1]) : null; // Return the matched number, or NULL if no match
// };

// --- Utility Function for API Calls ---
// Assuming apiCall function is available from the parent App component or a global context
export const apiCall = async (url, method = "GET", body = null, token = null) => {
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || "Something went wrong");
    }
    return data;
};
