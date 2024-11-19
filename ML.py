import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import mplfinance as mpf


stock_symbols = {
    "Apple": "AAPL",
    "Alphabet (Google)": "GOOGL",
    "Amazon": "AMZN",
    "Microsoft": "MSFT",
    "Tesla": "TSLA",
    "NVIDIA": "NVDA",
    "Meta Platforms": "META",
    "JPMorgan Chase": "JPM",
    "Visa": "V",
    "Mastercard": "MA",
    "PayPal": "PYPL",
    "Bank of America": "BAC",
    "Walmart": "WMT",
    "Disney": "DIS",
    "Johnson & Johnson": "JNJ",
    "Procter & Gamble": "PG",
    "UnitedHealth Group": "UNH",
    "Exxon Mobil": "XOM",
    "Chevron": "CVX",
    "Berkshire Hathaway": "BRK-B",
    "Eli Lilly": "LLY",
    "Abbott Laboratories": "ABT",
    "Merck": "MRK",
    "Pfizer": "PFE",
    "Thermo Fisher Scientific": "TMO",
    "Home Depot": "HD",
    "Lowe's": "LOW",
    "Costco": "COST",
    "McDonald's": "MCD",
    "Starbucks": "SBUX",
}
while True:
    try:
        stock_check=input()
        ticker = yf.Ticker(stock_symbols[stock_check])
        hist = ticker.history(start="2024-11-14", end="2024-11-15",interval="15m")
        print(hist)
        print("Do you want to end!!!")
        B=input()
        if B=="yes":
            break
    except KeyError:
        print("Invalid stock symbol.")
    except Exception as e:
        print(f"An error occurred: {e}")

print("Enter Grapstyle you want \n \t 1)Simple Line Plot \n \t 2)Candlestick Chart\n \t 3)Volume Chart\n \t 4)Combined Chart")
Choise=int(input())
if Choise==1:
    plt.figure(figsize=(12, 6))
    plt.plot(hist.index, hist['Close'])
    plt.xlabel('Date')
    plt.ylabel('Closing Price')
    plt.title(f'Closing Price of{stock_check}')
    plt.grid(True)
    plt.show()
elif Choise==2:
    mpf.plot(hist, type='candle', style='yahoo', title=f'{stock_check} Candlestick Chart', ylabel='Price')

elif Choise==3:
    plt.figure(figsize=(12, 6))
    plt.bar(hist.index, hist['Volume'], color='gray')
    plt.xlabel('Date')
    plt.ylabel('Volume')
    plt.title(f'Trading Volume of  {stock_check}')
    plt.grid(True)
    plt.show()
elif Choise==4:
    fig, ax1 = plt.subplots(figsize=(12, 6))

    color = 'tab:blue'
    ax1.set_xlabel('Date')
    ax1.set_ylabel('Price', color=color)
    ax1.plot(hist.index, hist['Close'], color=color)
    ax1.tick_params(axis='y', labelcolor=color)

    ax2 = ax1.twinx()

    color = 'tab:red'
    ax2.set_ylabel('Volume', color=color)
    ax2.bar(hist.index, hist['Volume'], color=color)
    ax2.tick_params(axis='y', labelcolor=color)

    fig.tight_layout()
    plt.show()
