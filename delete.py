from alpha_vantage.timeseries import TimeSeries
import pandas as pd
import os

# Replace with your actual API key (get from Alpha Vantage website)
api_key = "AMZN" #It is best to put this in an environment variable.

if api_key is None:
    print("Error: ALPHA_VANTAGE_API_KEY environment variable not set.")
    exit()

ts = TimeSeries(key=api_key, output_format='pandas')

try:
    data, meta_data = ts.get_intraday(symbol='AMZN', interval='60min', outputsize='full') # Get the hourly data
    print(data)
except Exception as e:
    print(f"Error: {e}")
