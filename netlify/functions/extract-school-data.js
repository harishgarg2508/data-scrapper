const ExcelJS = require('exceljs');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { data: fileContent } = JSON.parse(event.body);

    if (!fileContent) {
        return { statusCode: 400, body: 'No data provided.' };
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

        const buffer = await workbook.xlsx.writeBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="school_data.xlsx"',
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('An error occurred:', error);
        return { statusCode: 500, body: 'Failed to generate Excel file.' };
    }
};
