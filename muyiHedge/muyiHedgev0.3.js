
// Version 0.3

/* Input Parameters
   Name                  Description               Type     Default Value
   enMoney               Enable money              bool     false
   idxOfMoney@enMoney    Index of money            selected USD|KRW
   dotOfMoney@enMoney    Precision of money        number   0

   enCoin                Enable coin               bool     false
   idxOfCoin@enCoin      Index of coin             selected BCH|BTC|ETC|ETH|LTC
   dotOfCoin@enCoin      Precision of coin         number   5

   enMktA                Enable market A           bool     false
   idxOfMktA@enMktA      Index of market A         selected OKCoin_EN|Bitfinex|Coinone|Bithumb
   feeOfMktA@enMktA      Fee of market A           number   0.001
   orgCostA              Orginal cost A            number   0

   enMktB                Enable market B           bool     false
   idxOfMktB@enMktB      Index of market B         selected OKCoin_EN|Bitfinex|Coinone|Bithumb
   feeOfMktB@enMktB      Fee of market B           number   0.0015
   orgCostB              Orginal cost B            number   0

   resetData             Reset data after start    bool     false

   enTrade               Enable trade              bool     false
   gapToTrade            GAP to trade              number   0.005
   amountToTrade         Amount to trade           number   0.0001
   maxOfTry              Maximum tries             number   5

   maxInvest             Maxinum invest            number   10000
   thHigh                Threshold high            number   0.3
   thMiddle              Threshold middle          number   0.2
   thLow                 Threshold low             number   0.1
 */

// Money
var typeOfMoney;

// Coin
var typeOfCoin;

// Market A
var initAccountA;
var nameOfMktA;
var initBalanceA;
var initStocksA;
var tradesA;
var tickerA;
var currAccountA;
var currBalanceA;
var currStocksA;
var flagStartSellA = 0;     // For close position
var flagStopSellA = 0;
var flagStartBuyA = 0;      // For close position
var flagStopBuyA = 0;
var actualCostA = 0;
var actualInvestA = 0;

// Market B
var initAccountB;
var nameOfMktB;
var initBalanceB;
var initStocksB;
var tradesB;
var tickerB;
var currAccountB;
var currBalanceB;
var currStocksB;
var flagStartSellB = 0;     // For close position
var flagStopSellB = 0;
var flagStartBuyB = 0;      // For close position
var flagStopBuyB = 0;
var actualCostB = 0;
var actualInvestB = 0;

// Variables
var numOfTry = 1;
var delayOfMainLoop = 1000;
var flagSellABuyB = 0;
var flagSellBBuyA = 0;
var potentialIncome = 0;
var potentialOutgo = 0;
var flagExit = 0;
var totalProfit = 0;
var actualIncome = 0; // For simulation
var actualOutgo = 0;  // For simulation

function fnGetTradesForMkts() {
    // Trades for market A
    if (nameOfMktA == 'Coinone' || nameOfMktA == 'Bithumb') {
        tradesA = _C(exchanges[0].GetTrades);

        Log(nameOfMktA, "ID:", tradesA.Id, "Time:", tradesA.Time, "Price:", tradesA.Price,
                "Amount:", tradesA.Amount, "Type:", tradesA.Type);

    }

    // Trades for market B
    if (nameOfMktB == 'Coinone' || nameOfMktB == 'Bithumb') {
        tradesB = _C(exchanges[1].GetTrades);

        Log(nameOfMktB, "ID:", tradesB.Id, "Time:", tradesB.Time, "Price:", tradesB.Price,
                "Amount:", tradesB.Amount, "Type:", tradesB.Type);

    }
}

function fnGetTickerForMkts() {
  var depth = _C(exchanges[0].GetDepth);
  Log(nameOfMktA, "Asks0:", depth.Asks[0].Price, "Bids0:", depth.Bids[0].Price);

    // Ticker for market A
    tickerA = _C(exchanges[0].GetTicker);

tickerA.Sell = depth.Asks[0].Price;
tickerA.Buy = depth.Bids[0].Price;

    Log(nameOfMktA, "High:", tickerA.High, "Low:", tickerA.Low,
            "Sell:", tickerA.Sell, "Buy:", tickerA.Buy,
            "Last:", tickerA.Last, "Volume:", tickerA.Volume);




    if (0 == actualCostA) {
        actualCostA = _N((tickerA.Buy + tickerA.Sell) / 2);
        Log('Set Actual Cost of', nameOfMktA, 'to', actualCostA);
    }

    // Ticker for market B
    tickerB = _C(exchanges[1].GetTicker);

       Log(nameOfMktB, "High:", tickerB.High, "Low:", tickerB.Low,
       "Sell:", tickerB.Sell, "Buy:", tickerB.Buy,
       "Last:", tickerB.Last, "Volume:", tickerB.Volume);


    if (0 == actualCostB) {
        actualCostB = _N((tickerB.Buy + tickerB.Sell) / 2);
        Log('Set Actual Cost of', nameOfMktB, 'to', actualCostB);
    }
}

function fnDirectionalFlagCheck() {
    // For Market A

       Log(nameOfMktA, ': Actual Cost[', actualCostA,
       '], Coin[', currAccountA.Stocks,
       '], Money[', currAccountA.Balance, ']')

    if (actualCostA * currAccountA.Stocks + currAccountA.Balance < maxInvest) {
        // Money and coin is less than maximum invest
        actualInvestA = actualCostA * currAccountA.Stocks + currAccountA.Balance;
    } else if (actualCostA * currAccountA.Stocks + currAccountA.Balance >= maxInvest) {
        // Money and coin is equal or more than maximum invest
        actualInvestA = maxInvest;
    }

    if (actualCostA * currAccountA.Stocks / actualInvestA >= thHigh) {
        // Coin is more than threshold high
        flagStartSellA = 1;
        flagStopSellA = 0;
        flagStartBuyA = 0;
        flagStopBuyA = 1;
    } else if (actualCostA * currAccountA.Stocks / actualInvestA >= thMiddle) {
        // Coin is more than threshold middle but less than threshold high
        flagStartSellA = 1;
        flagStopSellA = 0;
        flagStartBuyA = 0;
        flagStopBuyA = 0;
    } else if (actualCostA * currAccountA.Stocks / actualInvestA >= thLow) {
        // Coin is more than threshold low but less than threshold middle
        flagStartSellA = 0;
        flagStopSellA = 0;
        flagStartBuyA = 1;
        flagStopBuyA = 0;
    } else {
        // Coin is less than threshold low
        flagStartSellA = 0;
        flagStopSellA = 1;
        flagStartBuyA = 1;
        flagStopBuyA = 0;
    }

    Log('Flags for', nameOfMktA, ':',
            'StartSell[', flagStartSellA,
            '], StopSell[', flagStopSellA,
            '], StartBuy[', flagStartBuyA,
            '], StopBuy[', flagStopBuyA, ']', '#FF0000');

    // For Market B

    Log(nameOfMktB, ': Actual Cost[', actualCostB,
            '], Coin[', currAccountB.Stocks,
            '], Money[', currAccountB.Balance, ']')

    if (actualCostB * currAccountB.Stocks + currAccountB.Balance < maxInvest) {
        // Money and coin is less than maximum invest
        actualInvestB = actualCostB * currAccountB.Stocks + currAccountB.Balance;
    } else if (actualCostB * currAccountB.Stocks + currAccountB.Balance >= maxInvest) {
        // Money and coin is equal or more than maximum invest
        actualInvestB = maxInvest;
    }

    if (actualCostB * currAccountB.Stocks / actualInvestB >= thHigh) {
        // Coin is more than threshold high
        flagStartSellB = 1;
        flagStopSellB = 0;
        flagStartBuyB = 0;
        flagStopBuyB = 1;
    } else if (actualCostB * currAccountB.Stocks / actualInvestB >= thMiddle) {
        // Coin is more than threshold middle but less than threshold high
        flagStartSellB = 1;
        flagStopSellB = 0;
        flagStartBuyB = 0;
        flagStopBuyB = 0;
    } else if (actualCostB * currAccountB.Stocks / actualInvestB >= thLow) {
        // Coin is more than threshold low but less than threshold middle
        flagStartSellB = 0;
        flagStopSellB = 0;
        flagStartBuyB = 1;
        flagStopBuyB = 0;
    } else {
        // Coin is less than threshold low
        flagStartSellB = 0;
        flagStopSellB = 1;
        flagStartBuyB = 1;
        flagStopBuyB = 0;
    }

    Log('Flags for', nameOfMktB, ':',
            'StartSell[', flagStartSellB,
            '], StopSell[', flagStopSellB,
            '], StartBuy[', flagStartBuyB,
            '], StopBuy[', flagStopBuyB, ']', '#FF0000');
}

function fnPerformClosePosition() {
    // For Market A
    if (1 == flagStartSellA) {
        // Sell A
        if (actualCostA <= (tickerA.Buy * (1 - feeOfMktA))) {
            Log(nameOfMktA, ': Close Position needed. Actual Cost before selling[', actualCostA, ']', '#FF0000');
            // Get current information of account A before trade
            currAccountA = _C(exchanges[0].GetAccount);
            currBalanceA = _N(currAccountA.Balance);
            currStocksA = _N(currAccountA.Stocks);

            if (currStocksA < amountToTrade) {
                Log('Not enough coin for close position. Return...')
                return;
            }
            exchanges[0].Sell(tickerA.Buy, amountToTrade);
            Log("Close Position Sell A. @");

            // Cost A after sell
            actualCostA = _N((actualCostA * currStocksA -
                        tickerA.Buy * amountToTrade * (1 - feeOfMktA)) / (
                        currStocksA - amountToTrade));

            flagStartSellA = 0;
            Log(nameOfMktA, ': Close Position finished. Actual Cost after selling[', actualCostA, ']', '#FF0000');
        }

    } else if (1 == flagStartBuyA) {
        // Buy A
        if (actualCostA >= (tickerA.Sell * (1 + feeOfMktA))) {
            Log(nameOfMktA, ': Close Position needed. Actual Cost before buying[', actualCostA, ']', '#FF0000');
            // Get current information of account A before trade
            currAccountA = _C(exchanges[0].GetAccount);
            currBalanceA = _N(currAccountA.Balance);
            currStocksA = _N(currAccountA.Stocks);

            if (currBalanceA < tickerA.Sell * amountToTrade) {
                Log('Not enough money for close position. Return...')
                return;
            }
            exchanges[0].Buy(tickerA.Sell, amountToTrade);
            Log("Close Position Buy A. @");

            // Cost A after buy
            actualCostA = _N((actualCostA * currStocksA +
                        tickerA.Sell * amountToTrade) / (currStocksA +
                            amountToTrade * (1 - feeOfMktA)));

            flagStartBuyA = 0;
            Log(nameOfMktA, ': Close Position finished. Actual Cost after buying[', actualCostA, ']', '#FF0000');
        }
    }

    // For Market B
    if (1 == flagStartSellB) {
        // Sell B
        if (actualCostB <= (tickerB.Buy * (1 - feeOfMktB))) {
            Log(nameOfMktB, ': Close Position needed. Actual Cost before selling[', actualCostB, ']', '#FF0000');
            // Get current information of account B before trade
            currAccountB = _C(exchanges[1].GetAccount);
            currBalanceB = _N(currAccountB.Balance);
            currStocksB = _N(currAccountB.Stocks);

            if (currStocksB < amountToTrade) {
                Log('Not enough coin for close position. Return...')
                return;
            }
            exchanges[1].Sell(tickerB.Buy, amountToTrade);
            Log("Close Position Sell B. @");

            // Cost B after sell
            actualCostB = _N((actualCostB * currStocksB -
                        tickerB.Buy * amountToTrade * (1 - feeOfMktB)) / (
                        currStocksB - amountToTrade));

            flagStartSellB = 0;
            Log(nameOfMktB, ': Close Position finished. Actual Cost after selling[', actualCostB, ']', '#FF0000');
        }
    } else if (1 == flagStartBuyB) {
        // Buy B
        if (actualCostB >= (tickerB.Sell * (1 + feeOfMktB))) {
            Log(nameOfMktB, ': Close Position needed. Actual Cost before Buying[', actualCostB, ']', '#FF0000');
            // Get current information of account B before trade
            currAccountB = _C(exchanges[1].GetAccount);
            currBalanceB = _N(currAccountB.Balance);
            currStocksB = _N(currAccountB.Stocks);

            if (currBalanceB < tickerB.Sell * amountToTrade) {
                Log('Not enough money for close position. Return...')
                return;
            }
            exchanges[1].Buy(tickerB.Sell, amountToTrade);
            Log("Close Position Buy B. @");

            // Cost B after buy
            actualCostB = _N((actualCostB * currStocksB +
                        tickerB.Sell * amountToTrade) / (currStocksB +
                            amountToTrade * (1 - feeOfMktB)));

            flagStartBuyB = 0;
            Log(nameOfMktB, ': Close Position finished. Actual Cost after Buying[', actualCostB, ']', '#FF0000');
        }
    }
}

function onTick() {
    //fnGetTradesForMkts();

    fnGetTickerForMkts();

    currAccountA = _C(exchanges[0].GetAccount);
    currAccountB = _C(exchanges[1].GetAccount);

    LogProfit(_N(currBalanceA + currBalanceB - initBalanceA - initBalanceB));

    fnDirectionalFlagCheck();

    // Reset flags first
    flagSellABuyB = 0;
    flagSellBBuyA = 0;

    // Profit checking algorithm
    potentialIncome = 0;
    potentialOutgo = 0;

    //if (tickerA.Buy > tickerB.Sell) {
    if (_N(tickerA.Buy * (1 - feeOfMktA)) > _N(tickerB.Sell * (1 + feeOfMktB))) {
        Log(nameOfMktA, 'is higher than', nameOfMktB, '. Check for arbitrage chance...');

        potentialIncome = _N(tickerA.Buy * (1 - feeOfMktA));
        potentialOutgo = _N(tickerB.Sell * (1 + feeOfMktB));

        var profitRatio = _N(potentialIncome/potentialOutgo) - 1;
        Log('Profit ratio is', profitRatio);

        if (profitRatio >= gapToTrade) {
            Log('Good chance for arbitrage. Lucky us...');
            Log('Potential profit:', typeOfMoney, _N(potentialIncome - potentialOutgo),
            'per', typeOfCoin, '#FF0000');

            flagSellABuyB = 1;
            flagSellBBuyA = 0;

        } else {
            Log('No chance for arbitrage. Reset flags then next round...');
            flagSellABuyB = 0;
            flagSellBBuyA = 0;
            return;
        }

        if (1 == flagStopSellA || 1 == flagStopBuyB) {
            Log('StopSellA[', flagStopSellA, '], StopBuyB[', flagStopBuyB, ']. Next round...');
            return;
        }

        if (currAccountA.Stocks < amountToTrade) {
            Log('Not enough coin to trade. Next round...');
            return;
        }

        if (currAccountB.Balance < potentialOutgo * amountToTrade) {
            Log('Not enough money to trade. Next round...');
            return;
        }

    //} else if (tickerA.Sell < tickerB.Buy) {
    } else if (_N(tickerB.Buy * (1 - feeOfMktB)) > _N(tickerA.Sell * (1 + feeOfMktA))) {
        Log(nameOfMktB, 'is higher than', nameOfMktA, ', Check for arbitrage chance...');

        potentialIncome = _N(tickerB.Buy * (1 - feeOfMktB));
        potentialOutgo = _N(tickerA.Sell * (1 + feeOfMktA));

        var profitRatio = _N(potentialIncome/potentialOutgo) - 1;
        Log('Profit ratio is', profitRatio);

        if (profitRatio >= gapToTrade) {
            Log('Good chance for arbitrage. Lucky us...');
            Log('Potential profit:', typeOfMoney, _N(potentialIncome - potentialOutgo),
            'per', typeOfCoin, '#FF0000');

            flagSellABuyB = 0;
            flagSellBBuyA = 1;
        } else {
            Log('No chance for arbitrage. Reset flags then next round...');
            flagSellABuyB = 0;
            flagSellBBuyA = 0;
            return;
        }

        if (1 == flagStopSellB || 1 == flagStopBuyA) {
            Log('StopSellB[', flagStopSellB, '], StopBuyA[', flagStopBuyA, ']. Next round...');
            return;
        }

        if (currAccountB.Stocks < amountToTrade) {
            Log('Not enough coin to trade. Next round...');
            return;
        }

        if (currAccountA.Balance < potentialOutgo * amountToTrade) {
            Log('Not enough money to trade. Next round...');
            return;
        }
    } else {
        Log('No chance for arbitrage. Next round...');
        flagSellABuyB = 0;
        flagSellBBuyA = 0;
        return;
    }


    if (enTrade == true) {
        fnPerformClosePosition();

        // Get current information of account A before trade
        currAccountA = _C(exchanges[0].GetAccount);
        currBalanceA = _N(currAccountA.Balance);
        currStocksA = _N(currAccountA.Stocks);

        // Get current information of account B before trade
        currAccountB = _C(exchanges[1].GetAccount);
        currBalanceB = _N(currAccountB.Balance);
        currStocksB = _N(currAccountB.Stocks);

        // Trade and reset flags
        if (1 == flagSellABuyB && 0 == flagSellBBuyA) {
            exchanges[0].Sell(tickerA.Buy, amountToTrade);
            exchanges[1].Buy(tickerB.Sell, amountToTrade);

            // Cost A after sell
            actualCostA = _N((actualCostA * currStocksA -
                    tickerA.Buy * amountToTrade * (1 - feeOfMktA)) / (
                    currStocksA - amountToTrade));

            // Cost B after buy
            actualCostB = _N((actualCostB * currStocksB +
                    tickerB.Sell * amountToTrade) / (currStocksB +
                        amountToTrade * (1 - feeOfMktB)));

        } else if (0 == flagSellABuyB && 1 == flagSellBBuyA) {
            exchanges[1].Sell(tickerB.Buy, amountToTrade);
            exchanges[0].Buy(tickerA.Sell, amountToTrade);

            // Cost B after sell
            actualCostB = _N((actualCostB * currStocksB -
                    tickerB.Buy * amountToTrade * (1 - feeOfMktB)) / (
                    currStocksB - amountToTrade));

            // Cost A after buy
            actualCostA = _N((actualCostA * currStocksA +
                    tickerA.Sell * amountToTrade) / (currStocksA +
                        amountToTrade * (1 - feeOfMktA)));

        }

        // Get current information of account A after trade
        currAccountA = _C(exchanges[0].GetAccount);
        currBalanceA = _N(currAccountA.Balance);
        currStocksA = _N(currAccountA.Stocks);

        // Get current information of account B after trade
        currAccountB = _C(exchanges[1].GetAccount);
        currBalanceB = _N(currAccountB.Balance);
        currStocksB = _N(currAccountB.Stocks);
        /*
           LogProfit(_N(currBalanceA + currStocksA * actualCostA +
           currBalanceB + currStocksB * actualCostB -
           initBalanceA - initStocksA * actualCostA -
           initBalanceB - initStocksB * actualCostB));
         */
        LogProfit(_N(currBalanceA + currBalanceB - initBalanceA - initBalanceB));
        Log('currBalanceA', currBalanceA, 'currBalanceB', currBalanceB, 'initBalanceA', initBalanceA, 'initBalanceB', initBalanceB);
        Log('Actual Cost A:', actualCostA, ', Actual Cost B:', actualCostB);
        Log("Trade finished.", 'currBalanceA', currBalanceA, 'currBalanceB', currBalanceB,
                'initBalanceA', initBalanceA, 'initBalanceB', initBalanceB, ". @");

        flagSellABuyB = 0;
        flagSellBBuyA = 0;
    } else {
        // Simulation and reset flags
        if (1 == flagSellABuyB && 0 == flagSellBBuyA) {
            Log('Simulation: Sell', amountToTrade, 'of', typeOfCoin, 'at', tickerA.Buy, 'in', nameOfMktA,
                    ', Buy', amountToTrade, 'of', typeOfCoin, 'at', tickerB.Sell, 'in', nameOfMktB, '#FF0000');
        } else if (0 == flagSellABuyB && 1 == flagSellBBuyA) {
            Log('Simulation: Sell', amountToTrade, 'of', typeOfCoin, 'at', tickerB.Buy, 'in', nameOfMktB,
                    ', Buy', amountToTrade, 'of', typeOfCoin, 'at', tickerA.Sell, 'in', nameOfMktA, '#FF0000');
        }

        Log('Profit is', typeOfMoney, _N((potentialIncome - potentialOutgo) * amountToTrade),
                ', Total profit is', _N(totalProfit += (potentialIncome - potentialOutgo) * amountToTrade), '#FF0000');

        flagSellABuyB = 0;
        flagSellBBuyA = 0;
    }
}

function onexit() {
    Log("Cylon Zoe shut down, see you next time...", '#FF0000@');
}

function fnParseMoneyIdx() {
    // 0: USD | 1: KRW
    if (0 == idxOfMoney) {
        typeOfMoney = 'USD';
    } else if (1 == idxOfMoney) {
        typeOfMoney = 'KRW';
    }
}

function fnParseCoinIdx() {
    // 0: BCH | 1: BTC | 2: ETC | 3: ETH | 4: LTC
    if (0 == idxOfCoin) {
        typeOfCoin = 'BCH';
    } else if (1 == idxOfCoin) {
        typeOfCoin = 'BTC';
    } else if (2 == idxOfCoin) {
        typeOfCoin = 'ETC';
    } else if (3 == idxOfCoin) {
        typeOfCoin = 'ETH';
    } else if (4 == idxOfCoin) {
        typeOfCoin = 'LTC';
    }
}

function fnParseCoinIdxKrw() {
    // 0: BCH | 1: BTC | 2: ETC | 3: ETH | 4: LTC
    if (0 == idxOfCoin) {
        typeOfCoin = 'BCH_KRW';
    } else if (1 == idxOfCoin) {
        typeOfCoin = 'BTC_KRW';
    } else if (2 == idxOfCoin) {
        typeOfCoin = 'ETC_KRW';
    } else if (3 == idxOfCoin) {
        typeOfCoin = 'ETH_KRW';
    } else if (4 == idxOfCoin) {
        typeOfCoin = 'LTC_KRW';
    }
}

function fnParseMktIdx() {
    Log('idxOfMktA', idxOfMktA, 'idxOfMktB', idxOfMktB);

    // 0: OKCoin_EN | 1: Bitfinex | 2: Coinone | 3: Bithumb
    if (0 == idxOfMktA) {
        nameOfMktA = 'OKCoin_EN';
    } else if (1 == idxOfMktA) {
        nameOfMktA = 'Bitfinex';
    } else if (2 == idxOfMktA) {
        nameOfMktA = 'Coinone';
    } else if (3 == idxOfMktA) {
        nameOfMktA = 'Bithumb';
    }

    // 0: OKCoin_EN | 1: Bitfinex | 2: Coinone | 3: Bithumb
    if (0 == idxOfMktB) {
        nameOfMktB = 'OKCoin_EN';
    } else if (1 == idxOfMktB) {
        nameOfMktB = 'Bitfinex';
    } else if (2 == idxOfMktB) {
        nameOfMktB = 'Coinone';
    } else if (3 == idxOfMktB) {
        nameOfMktB = 'Bithumb';
    }
}

function main() {
    if (resetData) {
        LogProfitReset();
        LogReset();
    }

    Log('Welcome to Graystone Corp. ver 0.3.', '#FF0000');
    Log('This version support one coin and two markets.');
    Log('Cylon Zoe is booting up...', '#FF0000@');

    // Check initial flags
    if (enMoney != true || enCoin != true || enMktA != true || enMktB != true) {
        Log('All money, coin, market A and B should be enabled. Exit...', '#FF0000');
        return;
    }

    actualCostA = orgCostA;
    actualCostB = orgCostB;

    fnParseMoneyIdx();

    fnParseMktIdx();

    if (nameOfMktA == 'OKCoin_EN' || nameOfMktA == 'Bitfinex') {
        fnParseCoinIdx();
    } else if (nameOfMktA == 'Coinone' || nameOfMktA == 'Bithumb') {
        fnParseCoinIdxKrw();
    }

    Log('Initial parsing complete...');

    // Get basic information from market A
    initAccountA = _C(exchanges[0].GetAccount);
    initBalanceA = initAccountA.Balance;
    initStocksA = initAccountA.Stocks;
    if (nameOfMktA == _C(exchanges[0].GetName) &&
            typeOfCoin == _C(exchanges[0].GetCurrency) &&
            typeOfMoney == _C(exchanges[0].GetQuoteCurrency)) {
        Log('Market A:', nameOfMktA,
                '| Initial', typeOfMoney, ':', initBalanceA,
                '| Initial', typeOfCoin, ':', initStocksA,
                '| Trade Fee:', feeOfMktA);
    } else {
        Log('Incorrect parameters for market A. Exit...',
                _C(exchanges[0].GetName), _C(exchanges[0].GetCurrency),
                '#FF0000');
        return;
    }

    Log('Get basic information from market A complete...');

    exchanges[0].SetPrecision(dotOfMoney, dotOfCoin);

    // Get basic information from market B
    initAccountB = _C(exchanges[1].GetAccount);
    initBalanceB = initAccountB.Balance;
    initStocksB = initAccountB.Stocks;
    if (nameOfMktB == _C(exchanges[1].GetName) &&
            typeOfCoin == _C(exchanges[1].GetCurrency) &&
            typeOfMoney == _C(exchanges[1].GetQuoteCurrency)) {
        Log('Market B:', nameOfMktB,
                '| Initial', typeOfMoney, ':', initBalanceB,
                '| Initial', typeOfCoin, ':', initStocksB,
                '| Trade Fee:', feeOfMktB);
    } else {
        Log('Incorrect parameters for market B. Exit...',
                _C(exchanges[1].GetName), _C(exchanges[1].GetCurrency),
                '#FF0000');
        return;
    }

    Log('Get basic information from market B complete...');

    exchanges[1].SetPrecision(dotOfMoney, dotOfCoin);

    // Main loop
    while (true) {
        Log('Main Loop, try', numOfTry);
        onTick();

        if (numOfTry >= maxOfTry && 0 != maxOfTry || 1 == flagExit) {
            return;
        }

        numOfTry++;
        Sleep(delayOfMainLoop);
    }
}
