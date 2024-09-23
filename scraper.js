const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path'); // For resolving paths

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON
app.use(express.json());

// Endpoint to handle the data extraction
app.post('/extract-school-data', async (req, res) => {
    const fileContent = req.body.data;

    if (!fileContent) {
        return res.status(400).send('No data provided.');
    }

    // Process the data and generate the Excel file (same as before)
    const schoolEntries = fileContent.split(/\d+\t\d+\t/);
    const schoolData = [];

    schoolEntries.forEach(entry => {
        if (entry.trim() === '') return;

        const lines = entry.trim().split('\n');
        const schoolName = lines[0].trim();

        let village = '', block = '', district = '', state = '', pinCode = '';

        lines.forEach(line => {
            if (line.includes('Village:')) village = line.split(':')[1].trim();
            if (line.includes('Block :')) block = line.split(':')[1].trim();
            if (line.includes('District :')) district = line.split(':')[1].trim();
            if (line.includes('State :')) state = line.split(':')[1].trim();
            if (line.includes('Pin Code :')) {
                pinCode = line.split(':')[1].trim().slice(0, 6);
            }
        });

        const addressComponents = [village, block, district, state, pinCode].filter(component => component !== '');
        const address = `${schoolName}, ${addressComponents.join(', ')}`;

        schoolData.push({ schoolName, address });
    });

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('School Data');
        worksheet.addRow(['School Name', 'Address']);

        schoolData.forEach(school => {
            worksheet.addRow([school.schoolName, school.address]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="school_data.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Failed to generate Excel file.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
