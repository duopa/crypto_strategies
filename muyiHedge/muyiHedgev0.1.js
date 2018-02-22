// Version 0.1

/* Input Parameters
   Name                       Description                   Type            Default Value
   numOfMkt                   The number of markets         number          2
   numOfCoin                  The number of coins           number          1
   tradeFee                   Trade Fee                     bool            true
   feeOKCoin_EN@tradeFee      Fee of OKCoin_EN              number          0.0015
   feeBitfinex@tradeFee       Fee of Bitfinex               number          0.002
   feeCoinone@tradeFee        Fee of Coinone                number          0.0015
   feeBithumb@tradeFee        Fee of Bithumb                number          0.001
   amountToTrade              Amount to trade               number          0.01
   gapToTrade                 GAP to trade                  number          0.01
*/

// Variables
var numOfTry = 1;
var loopDelay = 5000;

// Arrays
var initAccount = [numOfMkt];
var nameOfMkt = [numOfMkt]
var typeOfCoin = [numOfMkt];
var typeOfMoney = [numOfMkt];
var feeOfMkt = [numOfMkt];
var tradeOfMkt = [numOfMkt];
var tickerOfMkt = [numOfMkt];
var sellOneOfMkt = [numOfMkt];
var buyOneOfMkt = [numOfMkt];

function onTick() {
    for (var idx = 0; idx < numOfMkt; idx++) {
        // GetTrades only works for real market
        if (nameOfMkt[idx] == 'Coinone' || nameOfMkt[idx] == 'Bithumb') {
            tradeOfMkt[idx] = exchanges[idx].GetTrades();
            Log("ID:", tradeOfMkt[idx].Id,
                "Time:", tradeOfMkt[idx].Time,
                "Price:", tradeOfMkt[idx].Price,
                "Amount:", tradeOfMkt[idx].Amount,
                "Type:", tradeOfMkt[idx].Type);
        }

        tickerOfMkt[idx] = exchanges[idx].GetTicker();
        sellOneOfMkt[idx] = tickerOfMkt[idx].Sell;
        buyOneOfMkt[idx] = tickerOfMkt[idx].Buy;
        Log(nameOfMkt[idx], ',',
            typeOfCoin[idx], ',',
            "Sell 1:", sellOneOfMkt[idx],
            "Buy 1:", buyOneOfMkt[idx]);
        /* Log(nameOfMkt[idx], ',',
            typeOfCoin[idx], ',',
            "High:", tickerOfMkt[idx].High,
            "Low:", tickerOfMkt[idx].Low,
            "Sell 1:", tickerOfMkt[idx].Sell,
            "Buy 1:", tickerOfMkt[idx].Buy,
            "Last:", tickerOfMkt[idx].Last,
            "Volume:", tickerOfMkt[idx].Volume);
            */
    }

    // Comparison and trade
    /*
    Log('Before:',
        exchanges[0].GetName(),
        exchanges[0].GetAccount().Balance,
        exchanges[0].GetAccount().Stocks,
        exchanges[1].GetName(),
        exchanges[1].GetAccount().Balance,
        exchanges[1].GetAccount().Stocks);
        */

    // TBD whether it is possible to trade or not.
    if (sellOneOfMkt[0] * (1 + (nameOfMkt[0] == 'OKCoin_EN' ? 0.0015 : 0.001)) <
        buyOneOfMkt[1] * (1 - (nameOfMkt[1] == 'Bitfinex' ? 0.001 : 0.0015)) - gapToTrade) {
        Log('Before: total Balance is',
            exchanges[0].GetAccount().Balance + exchanges[1].GetAccount().Balance,
            ', total stocks are',
            exchanges[0].GetAccount().Stocks + exchanges[1].GetAccount().Stocks);

        exchanges[0].Buy(sellOneOfMkt[0], amountToTrade);
        exchanges[1].Sell(buyOneOfMkt[1], amountToTrade);

        Log('After: total Balance is',
            exchanges[0].GetAccount().Balance + exchanges[1].GetAccount().Balance,
            ', total stocks are',
            exchanges[0].GetAccount().Stocks + exchanges[1].GetAccount().Stocks);
    } else if (sellOneOfMkt[1] * (1 + (nameOfMkt[1] == 'OKCoin_EN' ? 0.0015 : 0.001)) <
        buyOneOfMkt[0] * (1 - (nameOfMkt[0] == 'Bitfinex' ? 0.001 : 0.0015)) - gapToTrade) {
        Log('Before: total Balance is',
            exchanges[0].GetAccount().Balance + exchanges[1].GetAccount().Balance,
            ', total stocks are',
            exchanges[0].GetAccount().Stocks + exchanges[1].GetAccount().Stocks);

        exchanges[1].Buy(sellOneOfMkt[1], amountToTrade);
        exchanges[0].Sell(buyOneOfMkt[0], amountToTrade);

        Log('After: total Balance is',
            exchanges[0].GetAccount().Balance + exchanges[1].GetAccount().Balance,
            ', total stocks are',
            exchanges[0].GetAccount().Stocks + exchanges[1].GetAccount().Stocks);
    }
    /*
    Log('After:',
        exchanges[0].GetName(),
        exchanges[0].GetAccount().Balance,
        exchanges[0].GetAccount().Stocks,
        exchanges[1].GetName(),
        exchanges[1].GetAccount().Balance,
        exchanges[1].GetAccount().Stocks);
    */
}

function onexit() {
    Log("Cylon Zoe shut down, see you next time...", '#FF0000');
}

function main() {
    Log('Welcome to Graystone Corp. ver 0.1.', '#FF0000');
    Log('This version support one coin and two markets.');
    Log('Cylon Zoe is booting up...', '#FF0000');

    if (2 == numOfMkt) {
        Log('The number of markets is ', numOfMkt);
    } else {
        Log('The number of markets is', numOfMkt,
            ', currently only support 2 markets, exit...', '#FF0000');
        return;
    }

    if (1 == numOfCoin) {
        Log('The number of coins is ', numOfCoin);
    } else {
        Log('The number of coins is', numOfCoin,
            ', currently only support 2 coins, exit...', '#FF0000');
        return;
    }

    for (var idx = 0; idx < numOfMkt; idx++) {
        initAccount[idx] = exchanges[idx].GetAccount();
        nameOfMkt[idx] = exchanges[idx].GetName();
        typeOfCoin[idx] = exchanges[idx].GetCurrency();
        typeOfMoney[idx] = exchanges[idx].GetQuoteCurrency();

        if (nameOfMkt[idx] == 'OKCoin_EN') {
            feeOfMkt[idx] = feeOKCoin_EN;
        } else if (nameOfMkt[idx] == 'Bitfinex') {
            feeOfMkt[idx] = feeBitfinex;
        } else if (nameOfMkt[idx] == 'Coinone') {
            feeOfMkt[idx] = feeCoinone;
        } else if (nameOfMkt[idx] == 'Bithumb') {
            feeOfMkt[idx] = feeBithumb;
        } else {
            Log('Currently does not support', nameOfMkt[idx], 'exit...', '#FF0000');
            return;
        }

        Log('Market', idx + 1, ':', nameOfMkt[idx], ',',
            'Coin:', initAccount[idx].Stocks, typeOfCoin[idx], ',',
            'Money:', initAccount[idx].Balance, typeOfMoney[idx], ',',
            'Trade fee:', feeOfMkt[idx]);
    }

    while (true) {
        /*
        if (5 < numOfTry) {
            return;
        }
        */

        Log('Main loop, try', numOfTry);
        onTick();
        numOfTry++;
        Sleep(loopDelay);
    }
}


