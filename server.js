const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Import dotenv and call the config function.

const app = express();
app.use(express.json());
app.use(cors("*"));

// The .env file should contain your ALPHA_VANTAGE_API_KEY.
// The python script can access it via os.environ.

app.post('/get-stock-data', (req, res) => {
    const { stock_symbol } = req.body;

    if (!stock_symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
    }

    const pythonScriptPath = path.resolve(__dirname, 'ML.py');
    const pythonProcess = spawn('python', [pythonScriptPath, JSON.stringify({ stock_symbol })]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            return res.status(500).json({ error: `Python script error: ${errorOutput}` });
        }
        
        try {
            const parsedOutput = JSON.parse(output);

            if (parsedOutput.status === "error") {
               
                return res.status(500).json(parsedOutput);
            } else {
                return res.status(200).json(parsedOutput);
            }
        } catch (parseError) {
           
            console.error("Error parsing JSON output from Python:", output);
            return res.status(500).json({ error: "Failed to process Python output" });
        }
    });

    pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        res.status(500).json({ error: 'Failed to start Python process' });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
