const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_FILE = path.join(__dirname, '../data/calculations.xlsx');

// Ensure data directory exists
function ensureDataDirectory() {
    const dataDir = path.dirname(EXCEL_FILE);
    if (!fs.existsSync(dataDir)) {
        console.log('Creating data directory:', dataDir);
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Initialize Excel file if it doesn't exist
function initializeExcelFile() {
    if (!fs.existsSync(EXCEL_FILE)) {
        console.log('Creating new Excel file:', EXCEL_FILE);
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet([], {
            header: ['id', 'wallLength', 'wallHeight', 'wallThickness', 'wastage', 'bricks', 'cement', 'sand', 'createdAt']
        });
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Calculations');
        xlsx.writeFile(workbook, EXCEL_FILE);
        console.log('Excel file created successfully');
    }
}

// Initialize on module load
ensureDataDirectory();
initializeExcelFile();

function readExcel() {
    try {
        console.log('Reading Excel file:', EXCEL_FILE);
        if (!fs.existsSync(EXCEL_FILE)) {
            console.log('Excel file not found, creating new one');
            initializeExcelFile();
        }
        const workbook = xlsx.readFile(EXCEL_FILE);
        const worksheet = workbook.Sheets['Calculations'];
        const data = xlsx.utils.sheet_to_json(worksheet);
        console.log('Read data from Excel:', data);
        return data;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return [];
    }
}

function writeExcel(data) {
    try {
        console.log('Writing to Excel file:', data);
        if (!fs.existsSync(EXCEL_FILE)) {
            console.log('Excel file not found, creating new one');
            initializeExcelFile();
        }
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Calculations');
        xlsx.writeFile(workbook, EXCEL_FILE);
        console.log('Data written to Excel successfully');
    } catch (error) {
        console.error('Error writing to Excel file:', error);
        throw error;
    }
}

module.exports = {
    saveCalculation: (calculation) => {
        try {
            console.log('Saving calculation:', calculation);
            const data = readExcel();
            calculation.id = Date.now().toString();
            calculation.createdAt = new Date().toISOString();
            data.push(calculation);
            writeExcel(data);
            console.log('Calculation saved successfully');
            return calculation;
        } catch (error) {
            console.error('Error in saveCalculation:', error);
            throw error;
        }
    },

    getCalculations: () => {
        try {
            const data = readExcel();
            return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error in getCalculations:', error);
            return [];
        }
    },

    getCalculationById: (id, userId) => {
        const data = readExcel();
        return data.find(calc => calc.id === id && calc.userId === userId);
    }
}; 