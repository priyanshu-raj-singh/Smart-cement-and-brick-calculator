document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate');
    const saveToExcelBtn = document.getElementById('saveToExcel');
    const results = document.getElementById('results');
    const saveStatus = document.getElementById('saveStatus');
    const wastageRange = document.getElementById('wastage-range');
    const wastageInput = document.getElementById('wastage');
    const locationInput = document.getElementById('location');
    const costEstimate = document.getElementById('cost-estimate');
    const environmentalImpact = document.getElementById('environmental-impact');
    const recommendations = document.getElementById('recommendations');
    const costDetail = document.getElementById('cost-detail');
    const environmentalDetail = document.getElementById('environmental-detail');
    const recommendationsDetail = document.getElementById('recommendations-detail');
    let currentUser = null;
    let currentCalculation = null;
    let allCalculations = []; // Store all calculations
    
    // Load xlsx library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    document.head.appendChild(script);
    
    // Constants for calculations
    const BRICK_SIZE = {
        length: 9, // inches
        width: 4.5, // inches
        height: 3 // inches
    };
    
    const MORTAR_THICKNESS = 0.5; // inches
    const CEMENT_PER_BAG = 1.25; // cubic feet
    const SAND_PER_BAG = 0.25; // cubic feet

    // Market price data (simulated AI data)
    const marketPrices = {
        'brick': 5, // per brick
        'cement': 400, // per bag
        'sand': 50 // per cubic foot
    };

    // Environmental impact factors (simulated AI data)
    const environmentalFactors = {
        'brick': 0.5, // kg CO2 per brick
        'cement': 0.8, // kg CO2 per kg
        'sand': 0.1 // kg CO2 per kg
    };

    // Smart recommendations based on location (simulated AI data)
    const locationBasedRecommendations = {
        'hot': {
            message: 'Consider using heat-resistant bricks and adding more cement for durability',
            wastage: 7
        },
        'cold': {
            message: 'Use frost-resistant materials and increase wall thickness for insulation',
            wastage: 5
        },
        'humid': {
            message: 'Add waterproofing additives to cement and use moisture-resistant bricks',
            wastage: 6
        },
        'default': {
            message: 'Standard construction materials recommended',
            wastage: 5
        }
    };

    // Sync wastage range and number input
    wastageRange.addEventListener('input', () => {
        wastageInput.value = wastageRange.value;
    });

    wastageInput.addEventListener('input', () => {
        wastageRange.value = wastageInput.value;
    });

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Fetch user preferences
        fetchUserPreferences(token);
    }

    calculateBtn.addEventListener('click', async () => {
        // Add loading animation
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
        calculateBtn.disabled = true;

        // Get input values
        const length = parseFloat(document.getElementById('length').value);
        const height = parseFloat(document.getElementById('height').value);
        const thickness = parseFloat(document.getElementById('thickness').value);
        const wastage = parseFloat(wastageInput.value) / 100;
        
        // Validate inputs
        if (isNaN(length) || isNaN(height) || length <= 0 || height <= 0) {
            alert('Please enter valid dimensions');
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calculate Materials';
            calculateBtn.disabled = false;
            return;
        }
        
        // Convert dimensions to inches
        const lengthInches = length * 12;
        const heightInches = height * 12;
        
        // Calculate wall area in square inches
        const wallArea = lengthInches * heightInches * thickness;
        
        // Calculate brick volume including mortar
        const brickVolume = (BRICK_SIZE.length + MORTAR_THICKNESS) * 
                           (BRICK_SIZE.width + MORTAR_THICKNESS) * 
                           (BRICK_SIZE.height + MORTAR_THICKNESS);
        
        // Calculate number of bricks needed
        let numberOfBricks = Math.ceil(wallArea / brickVolume);
        
        // Add wastage
        numberOfBricks = Math.ceil(numberOfBricks * (1 + wastage));
        
        // Calculate cement and sand requirements
        const cementBags = Math.ceil(numberOfBricks * 0.0004);
        const sandCubicFeet = Math.ceil(numberOfBricks * 0.0024);
        
        // Store current calculation
        currentCalculation = {
            wallLength: length,
            wallHeight: height,
            wallThickness: thickness,
            wastage: wastage * 100,
            bricks: numberOfBricks,
            cement: cementBags,
            sand: sandCubicFeet,
            timestamp: new Date().toLocaleString() // Add timestamp
        };

        // Add to all calculations
        allCalculations.push(currentCalculation);

        // Animate results
        results.style.display = 'block';
        results.style.opacity = '0';
        results.style.transform = 'translateY(20px)';
        
        // Update results with animation
        setTimeout(() => {
            document.getElementById('bricks').textContent = numberOfBricks.toLocaleString();
            document.getElementById('cement').textContent = cementBags.toLocaleString();
            document.getElementById('sand').textContent = sandCubicFeet.toLocaleString();
            
            results.style.opacity = '1';
            results.style.transform = 'translateY(0)';
            saveStatus.textContent = '';
            
            // Reset calculate button
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calculate Materials';
            calculateBtn.disabled = false;
        }, 300);

        // Save calculation if user is logged in
        if (currentUser) {
            try {
                await saveCalculation(currentCalculation);
            } catch (error) {
                console.error('Error saving calculation:', error);
            }
        }

        // Get AI insights
        const location = locationInput.value;
        const weatherRecommendations = await getWeatherRecommendations(location);
        
        // Update wastage based on recommendations
        wastageInput.value = weatherRecommendations.wastage;
        wastageRange.value = weatherRecommendations.wastage;
        
        // Calculate and display cost estimate
        const costEstimateData = calculateCostEstimate(currentCalculation);
        costEstimate.textContent = `₹${costEstimateData.total.toLocaleString()}`;
        costDetail.textContent = `Bricks: ₹${costEstimateData.breakdown.bricks.toLocaleString()} | Cement: ₹${costEstimateData.breakdown.cement.toLocaleString()} | Sand: ₹${costEstimateData.breakdown.sand.toLocaleString()}`;
        
        // Calculate and display environmental impact
        const environmentalData = calculateEnvironmentalImpact(currentCalculation);
        environmentalImpact.textContent = `${environmentalData.total.toFixed(1)} kg CO2`;
        environmentalDetail.textContent = `Bricks: ${environmentalData.breakdown.bricks.toFixed(1)} kg | Cement: ${environmentalData.breakdown.cement.toFixed(1)} kg | Sand: ${environmentalData.breakdown.sand.toFixed(1)} kg`;
        
        // Display recommendations
        recommendations.textContent = weatherRecommendations.message;
        recommendationsDetail.textContent = `Based on current weather conditions in ${location}`;
    });

    saveToExcelBtn.addEventListener('click', async () => {
        if (allCalculations.length === 0) {
            saveStatus.textContent = 'Please calculate first!';
            return;
        }

        try {
            // Add loading animation
            saveToExcelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveToExcelBtn.disabled = true;

            // Create a new workbook
            const wb = XLSX.utils.book_new();
            
            // Prepare data for Excel
            const excelData = [
                ['Date & Time', 'Wall Length (ft)', 'Wall Height (ft)', 'Wall Thickness (ft)', 'Wastage (%)', 'Bricks Needed', 'Cement Bags', 'Sand (cubic ft)']
            ];

            // Add all calculations to the data
            allCalculations.forEach(calc => {
                excelData.push([
                    calc.timestamp,
                    calc.wallLength,
                    calc.wallHeight,
                    calc.wallThickness,
                    calc.wastage,
                    calc.bricks,
                    calc.cement,
                    calc.sand
                ]);
            });
            
            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(excelData);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Calculations');
            
            // Generate Excel file
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
            
            // Convert to blob and download
            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cement_calculations_history.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            saveStatus.textContent = 'Excel file updated successfully!';
            saveStatus.style.color = '#27ae60';
            
            // Reset save button
            saveToExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i> Save to Excel';
            saveToExcelBtn.disabled = false;
        } catch (error) {
            saveStatus.textContent = 'Error updating Excel file. Please try again.';
            saveStatus.style.color = '#e74c3c';
            console.error('Error:', error);
            
            // Reset save button
            saveToExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i> Save to Excel';
            saveToExcelBtn.disabled = false;
        }
    });

    // Helper function to convert string to ArrayBuffer
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    async function fetchUserPreferences(token) {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                currentUser = user;
                
                // Set user preferences
                wastageInput.value = user.preferences.defaultWastage;
                wastageRange.value = user.preferences.defaultWastage;
                document.getElementById('thickness').value = user.preferences.defaultThickness;
            }
        } catch (error) {
            console.error('Error fetching user preferences:', error);
        }
    }

    async function saveCalculation(calculationData) {
        const response = await fetch('/api/calculations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(calculationData)
        });

        if (!response.ok) {
            throw new Error('Failed to save calculation');
        }
    }

    // Function to get weather-based recommendations
    async function getWeatherRecommendations(location) {
        try {
            // Simulated API call to weather service
            const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${location}`);
            const data = await response.json();
            
            const temp = data.current.temp_c;
            const humidity = data.current.humidity;
            
            if (temp > 30) return locationBasedRecommendations.hot;
            if (temp < 10) return locationBasedRecommendations.cold;
            if (humidity > 70) return locationBasedRecommendations.humid;
            return locationBasedRecommendations.default;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return locationBasedRecommendations.default;
        }
    }

    // Function to calculate cost estimate
    function calculateCostEstimate(calculation) {
        const brickCost = calculation.bricks * marketPrices.brick;
        const cementCost = calculation.cement * marketPrices.cement;
        const sandCost = calculation.sand * marketPrices.sand;
        const totalCost = brickCost + cementCost + sandCost;
        
        return {
            total: totalCost,
            breakdown: {
                bricks: brickCost,
                cement: cementCost,
                sand: sandCost
            }
        };
    }

    // Function to calculate environmental impact
    function calculateEnvironmentalImpact(calculation) {
        const brickImpact = calculation.bricks * environmentalFactors.brick;
        const cementImpact = calculation.cement * 50 * environmentalFactors.cement; // 50kg per bag
        const sandImpact = calculation.sand * 1600 * environmentalFactors.sand; // 1600kg per cubic meter
        
        const totalImpact = brickImpact + cementImpact + sandImpact;
        
        return {
            total: totalImpact,
            breakdown: {
                bricks: brickImpact,
                cement: cementImpact,
                sand: sandImpact
            }
        };
    }
}); 