import React, { useState, useEffect, useRef, memo } from 'react';

const CandlestickChart = memo(({ seriesData, stockName }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !window.Chart || !seriesData.length) {
            return;
        }

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        
        const chartData = seriesData.map(d => ({
            x: d.x.getTime(),
            o: d.y[0],
            h: d.y[1],
            l: d.y[2],
            c: d.y[3]
        }));

        chartRef.current = new window.Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: `${stockName} OHLC`,
                    data: chartData,
                    borderColor: '#e2e8f0',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                           label: (context) => {
                               const raw = context.raw;
                               return `O: ${raw.o.toFixed(2)} H: ${raw.h.toFixed(2)} L: ${raw.l.toFixed(2)} C: ${raw.c.toFixed(2)}`;
                           }
                        }
                    }
                },
                scales: {
                    x: { type: 'time', time: { unit: 'day', tooltipFormat: 'MMM dd, yyyy' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#a0aec0' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#a0aec0' } }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [seriesData, stockName]);

    return (
        <div style={{ position: 'relative', height: '400px' }}>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
});

const DataTable = ({ jsonData, title }) => {
    if (!jsonData) return null;
    let data;
    try {
        data = JSON.parse(jsonData);
        if (data.length === 0) return null;
    } catch (e) { return <p className="text-red-400">Error displaying data.</p>; }
    const headers = Object.keys(data[0]);
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-center mb-4">{title}</h2>
            <div className="overflow-x-auto max-h-96 relative">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
                        <tr>{headers.map(h => <th key={h} className="py-3 px-6">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b bg-gray-800 border-gray-700 hover:bg-gray-600">
                                {headers.map(h => <td key={`${i}-${h}`} className="py-4 px-6">{row[h]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function App() {
  const stockSymbols = {
    "Apple": "AAPL", "Alphabet (Google)": "GOOGL", "Amazon": "AMZN",
    "Microsoft": "MSFT", "Tesla": "TSLA", "NVIDIA": "NVDA", "Meta Platforms": "META",
    "JPMorgan Chase": "JPM", "Visa": "V", "Mastercard": "MA", "PayPal": "PYPL",
    "Bank of America": "BAC", "Walmart": "WMT", "Disney": "DIS", "Johnson & Johnson": "JNJ",
    "Procter & Gamble": "PG", "UnitedHealth Group": "UNH", "Exxon Mobil": "XOM",
    "Chevron": "CVX", "State Bank of India": "SBIN.NS", "Reliance Industries": "RELIANCE.NS"
  };

  const [selectedSymbol, setSelectedSymbol] = useState("Apple");
  const [seriesData, setSeriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [actualResult, setActualResult] = useState(null);
  const [googleSheetStatus, setGoogleSheetStatus] = useState(null);
  const [isChartLibReady, setIsChartLibReady] = useState(false);
  const [fullData, setFullData] = useState(null);
  const [lastDayData, setLastDayData] = useState(null);
  const [showHistoryTable, setShowHistoryTable] = useState(false);
  const [showValidationTable, setShowValidationTable] = useState(false);
  const [lastDaySeriesData, setLastDaySeriesData] = useState([]);
  const [accuracy, setAccuracy] = useState(null);

  const handleSymbolChange = (event) => setSelectedSymbol(event.target.value);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setSeriesData([]);
    setLastDaySeriesData([]);
    setPrediction(null);
    setValidationResult(null);
    setActualResult(null);
    setGoogleSheetStatus(null);
    setFullData(null);
    setLastDayData(null);
    setShowHistoryTable(false);
    setShowValidationTable(false);
    setAccuracy(null);

    try {
      const symbolToSend = stockSymbols[selectedSymbol];
      const response = await fetch("http://localhost:5000/get-stock-data", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_symbol: symbolToSend }),
      });
      const responseText = await response.text();
      if (!response.ok) throw new Error(`Server Error (Status: ${response.status}): ${responseText}`);
      const data = JSON.parse(responseText);
      if (data.status === "error") throw new Error(data.message);

      if (data.stock_data) {
        const parsed = JSON.parse(data.stock_data);
        const transformed = Object.keys(parsed.Close).map(ts => ({ x: new Date(ts), y: [parsed.Open[ts], parsed.High[ts], parsed.Low[ts], parsed.Close[ts]] }));
        transformed.sort((a, b) => a.x - b.x);
        setSeriesData(transformed);
        if (transformed.length >= 2) {
            setLastDaySeriesData(transformed.slice(-2));
        }
        const flatData = Object.keys(parsed.Close).map(ts => ({ Date: new Date(ts).toISOString().split('T')[0], ...Object.fromEntries(Object.keys(parsed).map(k => [k, parsed[k][ts]]))}));
        setFullData(JSON.stringify(flatData));
      } else {
        setError("Chart data was not returned.");
      }

      if (data.prediction_for_last_day) {
        setPrediction(data.prediction_for_last_day);
        setValidationResult(data.validation_result);
        setActualResult(data.actual_result_for_last_day);
        setLastDayData(data.last_day_data);
        if (data.accuracy !== undefined) {
          setAccuracy(data.accuracy);
        }
      }
      if (data.google_sheet_status) setGoogleSheetStatus(data.google_sheet_status);

    } catch (err) {
      setError(`Operation failed: ${err.message}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // --- FIX: Add Tailwind CSS to the page dynamically ---
    if (!document.getElementById('tailwind-cdn-script')) {
        const script = document.createElement('script');
        script.id = 'tailwind-cdn-script';
        script.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(script);
    }

    // Load Chart.js library
    if (window.Chart) { setIsChartLibReady(true); return; }
    const scriptUrls = ['https://cdn.jsdelivr.net/npm/chart.js@^4.0.0/dist/chart.umd.js', 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js', 'https://cdn.jsdelivr.net/npm/chartjs-chart-financial@^0.2.0/dist/chartjs-chart-financial.js'];
    let loadedScripts = 0;
    const loadScript = (url) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => { loadedScripts++; if (loadedScripts === scriptUrls.length) { setIsChartLibReady(true); } };
        document.head.appendChild(script);
    };
    scriptUrls.forEach(url => loadScript(url));
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">Stock Price Visualizer & Predictor</h1>
          <p className="text-gray-400 mt-2">Select a stock to see the model's performance on the most recent trading day.</p>
        </header>

        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <label htmlFor="stock-select" className="font-semibold">Select Stock:</label>
          <select id="stock-select" value={selectedSymbol} onChange={handleSymbolChange} className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full sm:w-auto">
            {Object.keys(stockSymbols).map((name) => (<option key={name} value={name}>{name}</option>))}
          </select>
          <button onClick={fetchData} disabled={isLoading} className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
            {isLoading ? 'Analyzing...' : 'Get Data & Predict'}
          </button>
        </div>

        {error && <p className="bg-red-500 text-white p-3 rounded-md text-center mb-8">{error}</p>}

        {prediction && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 className="text-2xl font-semibold text-gray-300 mb-2">Prediction for Last Day</h2><p className={`text-4xl font-bold ${prediction === 'Up' ? 'text-green-400' : 'text-red-400'}`}>{prediction}</p></div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 className="text-2xl font-semibold text-gray-300 mb-2">Prediction Result</h2><p className={`text-4xl font-bold ${validationResult === 'Correct' ? 'text-cyan-400' : 'text-orange-400'}`}>{validationResult}</p><span className="text-gray-400">Actual movement was {actualResult}</span></div>
            {accuracy !== null && (
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-semibold text-gray-300 mb-2">Model Accuracy</h2>
                <p className="text-4xl font-bold text-cyan-400">{(accuracy * 100).toFixed(2)}%</p>
              </div>
            )}
            {googleSheetStatus && (<div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 className="text-2xl font-semibold text-gray-300 mb-2">Google Sheet Status</h2><p className="text-lg text-gray-400">{googleSheetStatus}</p></div>)}
          </div>
        )}
        
        {prediction && (<div className="flex justify-center space-x-4 mb-8">
            <button onClick={() => setShowHistoryTable(s => !s)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">{showHistoryTable ? 'Hide' : 'Show'} Historical Data</button>
            <button onClick={() => setShowValidationTable(s => !s)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">{showValidationTable ? 'Hide' : 'Show'} Last Day Validation Data</button>
        </div>)}

        {showValidationTable && <DataTable jsonData={lastDayData} title="Last Day Validation Data" />}
        {showHistoryTable && <DataTable jsonData={fullData} title="Historical Training & Testing Data" />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {seriesData.length > 0 && (<div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-center mb-4">Historical Data Chart (2 Years)</h2>
                {isChartLibReady ? <CandlestickChart seriesData={seriesData} stockName={stockSymbols[selectedSymbol]}/> : <p className="text-center text-gray-400 py-8">Loading Chart Library...</p>}
            </div>)}
            {lastDaySeriesData.length > 0 && (<div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-center mb-4">Last Day Validation Chart</h2>
                {isChartLibReady ? <CandlestickChart seriesData={lastDaySeriesData} stockName={stockSymbols[selectedSymbol]}/> : <p className="text-center text-gray-400 py-8">Loading Chart Library...</p>}
            </div>)}
        </div>
      </div>
    </div>
  );
}

export default App;