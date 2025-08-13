/**
 * Frontend Calculation Helpers
 * Consistent calculation logic for the client-side
 */

/**
 * Calculate fuel sales from frontend entries
 * @param {Array} fuelEntries - Array of fuel entries from frontend
 * @returns {Object} Fuel calculation results
 */
export const calculateFuelSales = (fuelEntries) => {
    let totalFuelSale = 0;
    let totalDigitalPaymentsFromFuel = 0;
    
    fuelEntries.forEach(entry => {
        // Calculate litres sold for this entry
        let totalLitres = 0;
        
        entry.openingReadings.forEach((opening, index) => {
            const closing = parseFloat(entry.closingReadings[index]) || 0;
            const openingVal = parseFloat(opening) || 0;
            if (closing > openingVal) {
                totalLitres += closing - openingVal;
            }
        });
        
        const testingLitres = parseFloat(entry.testingLitres) || 0;
        const saleLitres = totalLitres - testingLitres;
        const unitPrice = parseFloat(entry.unitPrice) || 0;
        const saleAmount = Math.round(saleLitres * unitPrice);
        
        totalFuelSale += saleAmount;
        
        // Digital payments from fuel
        totalDigitalPaymentsFromFuel += Math.round(parseFloat(entry.digitalPayments.paytm) || 0);
        totalDigitalPaymentsFromFuel += Math.round(parseFloat(entry.digitalPayments.phonepe) || 0);
        totalDigitalPaymentsFromFuel += Math.round(parseFloat(entry.digitalPayments.other) || 0);
    });
    
    return {
        totalFuelSale,
        totalDigitalPaymentsFromFuel,
        cashFromFuel: Math.round(totalFuelSale - totalDigitalPaymentsFromFuel)
    };
};

/**
 * Calculate lube sales from frontend entries, separated by payment mode
 * @param {Array} lubeSales - Array of lube sales from frontend
 * @returns {Object} Lube sales breakdown
 */
export const calculateLubeSales = (lubeSales = []) => {
    let totalLubeSales = 0;
    let cashLubeSales = 0;
    let digitalLubeSales = 0;
    
    lubeSales.forEach(sale => {
        const amount = Math.round(parseFloat(sale.amount) || 0);
        const paymentMode = (sale.paymentMode || '').toLowerCase();
        
        totalLubeSales += amount;
        
        if (paymentMode === 'cash') {
            cashLubeSales += amount;
        } else {
            digitalLubeSales += amount;
        }
    });
    
    return {
        totalLubeSales,
        cashLubeSales,
        digitalLubeSales
    };
};

/**
 * Calculate credit sales total
 * @param {Array} creditSales - Array of credit sales
 * @returns {number} Total credit sales
 */
export const calculateCreditSales = (creditSales) => {
    let total = 0;
    creditSales.forEach(sale => {
        total += Math.round(parseFloat(sale.amount) || 0);
    });
    return total;
};

/**
 * Calculate expenses total
 * @param {Array} expenses - Array of expenses
 * @returns {number} Total expenses
 */
export const calculateExpenses = (expenses) => {
    let total = 0;
    expenses.forEach(expense => {
        total += Math.round(parseFloat(expense.amount) || 0);
    });
    return total;
};

/**
 * Calculate cash collections separated by mode
 * @param {Array} cashCollections - Array of cash collections
 * @returns {Object} Separated cash and digital collections + total
 */
export const calculateCollections = (cashCollections) => {
    let cashCollectionsAmount = 0;
    let digitalCollectionsAmount = 0;
    let totalCreditCollection = 0; // All collections (cash + digital)
    
    cashCollections.forEach(collection => {
        const amount = Math.round(parseFloat(collection.amount) || 0);
        const mode = collection.category || '';
        
        totalCreditCollection += amount; // Add to total regardless of mode
        
        // Only include collections where the mode is "cash"
        if (mode.toLowerCase() === 'cash') {
            cashCollectionsAmount += amount;
        } else {
            // All non-cash collections are considered digital payments
            digitalCollectionsAmount += amount;
        }
    });
    
    return {
        cashCollectionsAmount,
        digitalCollectionsAmount,
        totalCreditCollection // ALL collections (cash + digital)
    };
};

/**
 * Calculate complete shift totals using consistent logic
 * @param {Object} shiftData - Complete shift data from frontend
 * @returns {Object} Calculated totals
 */
export const calculateShiftTotals = (shiftData) => {
    const { fuelEntries = [], creditSales = [], lubeSales = [], expenses = [], cashCollections = [], actualCash = '' } = shiftData;
    
    // Calculate fuel sales
    const fuelResults = calculateFuelSales(fuelEntries);
    
    // Calculate other totals
    const totalCreditSales = calculateCreditSales(creditSales);
    const totalExpenses = calculateExpenses(expenses);
    const collections = calculateCollections(cashCollections);
    const lubeResults = calculateLubeSales(lubeSales);
    
    // Calculate expected cash: cash from fuel + cash lube sales - credit sales - expenses + cash collections (cash only)
    const expectedCash = Math.round(fuelResults.cashFromFuel + lubeResults.cashLubeSales - totalCreditSales - totalExpenses + collections.cashCollectionsAmount);
    
    // Total digital payments (fuel + collections + digital lube sales)
    const totalDigitalPaymentsOtherThanFuel = Math.round(collections.digitalCollectionsAmount + lubeResults.digitalLubeSales);
    const totalDigitalPayments = Math.round(fuelResults.totalDigitalPaymentsFromFuel + totalDigitalPaymentsOtherThanFuel);
    
    // Get actual cash from input
    const actualCashAmount = Math.round(parseFloat(actualCash) || 0);
    
    // Calculate difference (Expected - Actual)
    const cashDifference = Math.round(expectedCash - actualCashAmount);
    
    return {
        // Frontend display values
        totalFuelSale: fuelResults.totalFuelSale,
        totalDigitalPaymentsFromFuel: fuelResults.totalDigitalPaymentsFromFuel,
        digitalPaymentsOtherThanFuel: totalDigitalPaymentsOtherThanFuel, // Updated name
        totalDigitalPayments,
        cashFromFuel: fuelResults.cashFromFuel,
        totalCreditSales,
        creditReceipts: collections.cashCollectionsAmount,
        totalExpenses,
        cashLubeSales: lubeResults.cashLubeSales, // Only cash lube sales
        totalLubeSales: lubeResults.totalLubeSales, // Total lube sales for backend
        expectedCash,
        actualCash: actualCashAmount,
        cashDifference,
        
        // Backend expected field names
        totalSaleAmount: fuelResults.totalFuelSale + lubeResults.totalLubeSales, // include all lube sales in total sale amount for backend aggregate
        totalCashExpected: expectedCash,
        totalCashActual: actualCashAmount,
        totalCredit: totalCreditSales,
        totalOnlineFuel: fuelResults.totalDigitalPaymentsFromFuel, // Only fuel digital payments
        totalCreditCollection: collections.totalCreditCollection // ALL collections (cash + digital)
    };
};
