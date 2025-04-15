const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const excelHandler = require('../utils/excelHandler');

// Save calculation
router.post('/', async (req, res) => {
    try {
        console.log('Received calculation data:', req.body);
        const calculation = req.body;
        
        // Validate required fields
        if (!calculation.wallLength || !calculation.wallHeight || !calculation.wallThickness) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                received: calculation
            });
        }

        const savedCalculation = excelHandler.saveCalculation(calculation);
        console.log('Calculation saved successfully:', savedCalculation);
        res.status(201).json(savedCalculation);
    } catch (error) {
        console.error('Error in POST /calculations:', error);
        res.status(500).json({ 
            message: 'Error saving calculation', 
            error: error.message,
            stack: error.stack
        });
    }
});

// Get calculation history
router.get('/history', async (req, res) => {
    try {
        console.log('Fetching calculation history');
        const calculations = excelHandler.getCalculations();
        console.log('Retrieved calculations:', calculations);
        res.json(calculations);
    } catch (error) {
        console.error('Error in GET /history:', error);
        res.status(500).json({ 
            message: 'Error fetching calculations', 
            error: error.message,
            stack: error.stack
        });
    }
});

// Get calculation by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const calculation = excelHandler.getCalculationById(req.params.id, req.user.userId);

        if (!calculation) {
            return res.status(404).json({ message: 'Calculation not found' });
        }

        res.json(calculation);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching calculation', error: error.message });
    }
});

module.exports = router; 