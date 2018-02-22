
// Version 0.2

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

   enMktB                Enable market B           bool     false
   idxOfMktB@enMktB      Index of market B         selected OKCoin_EN|Bitfinex|Coinone|Bithumb
   feeOfMktB@enMktB      Fee of market B           number   0.0015

   resetData             Reset data after start    bool     false

   enTrade               Enable trade              bool     false
   gapToTrade            GAP to trade              number   0.005
   amountToTrade         Amount to trade           number   0.0001
   maxOfTry              Maximum tries             number   5

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
    // Ticker for market A
    tickerA = _C(exchanges[0].GetTicker);
    Log(nameOfMktA, "High:", tickerA.High, "Low:", tickerA.Low,
            "Sell:", tickerA.Sell, "Buy:", tickerA.Buy,
            "Last:", tickerA.Last, "Volume:", tickerA.Volume);

    // Ticker for market B
    tickerB = _C(exchanges[1].GetTicker);
    Log(nameOfMktB, "High:", tickerB.High, "Low:", tickerB.Low,
            "Sell:", tickerB.Sell, "Buy:", tickerB.Buy,
            "Last:", tickerB.Last, "Volume:", tickerB.Volume);
}

function onTick() {
    fnGetTradesForMkts();

    fnGetTickerForMkts();

    currAccountA = _C(exchanges[0].GetAccount);
    currAccountB = _C(exchanges[1].GetAccount);

    // Reset flags first
    flagSellABuyB = 0;
    flagSellBBuyA = 0;

    // Profit checking algorithm
    potentialIncome = 0;
    potentialOutgo = 0;

    if (tickerA.Buy > tickerB.Sell) {
        Log(nameOfMktA, 'is higher than', nameOfMktB, '. Check for arbitrage chance...');
        flagSellABuyB = 1;
        flagSellBBuyA = 0;

        if (currAccountA.Stocks < amountToTrade) {
            Log('Not enough coin to trade. Next round...');
            return;
        }

        potentialIncome = _N(tickerA.Buy * (1 - feeOfMktA));
        potentialOutgo = _N(tickerB.Sell * (1 + feeOfMktB));

        if (currAccountB.Balance < potentialOutgo) {
            Log('Not enough money to trade. Next round...');
            return;
        }

        if (_N(potentialIncome/potentialOutgo) >= _N(1 + gapToTrade)) {
            Log('Good change for arbitrage. Lucky us...');
            Log('Potential profit:', typeOfMoney, _N(potentialIncome - potentialOutgo),
            'per', typeOfCoin, '#FF0000');
        } else {
            Log('No change for arbitrage. Reset flags then next round...');
            flagSellABuyB = 0;
            flagSellBBuyA = 0;
            return;
        }
    } else if (tickerA.Sell < tickerB.Buy) {
        Log(nameOfMktB, 'is higher than', nameOfMktA, ', Check for arbitrage chance...');
        flagSellABuyB = 0;
        flagSellBBuyA = 1;

        if (currAccountB.Stocks < amountToTrade) {
            Log('Not enough coin to trade. Next round...');
            return;
        }

        potentialIncome = tickerB.Buy * (1 - feeOfMktB);
        potentialOutgo = tickerA.Sell * (1 + feeOfMktA);

        if (currAccountA.Balance < potentialOutgo) {
            Log('Not enough money to trade. Next round...');
            return;
        }

        if (potentialIncome/potentialOutgo >= (1 + gapToTrade)) {
            Log('Good change for arbitrage. Lucky us...');
            Log('Potential profit:', typeOfMoney, _N(potentialIncome - potentialOutgo),
            'per', typeOfCoin, '#FF0000');
        } else {
            Log('No change for arbitrage. Reset flags then next round...');
            flagSellABuyB = 0;
            flagSellBBuyA = 0;
            return;
        }
    } else {
        Log('No change for arbitrage. Next round...');
        return;
    }


    if (enTrade == true) {
        // Trade and reset flags
        if (1 == flagSellABuyB && 0 == flagSellBBuyA) {
            exchanges[0].Sell(tickerA.Buy, amountToTrade);
            exchanges[1].Buy(tickerB.Sell, amountToTrade);
        } else if (0 == flagSellABuyB && 1 == flagSellBBuyA) {
            exchanges[1].Sell(tickerB.Buy, amountToTrade);
            exchanges[0].Buy(tickerA.Sell, amountToTrade);
        }

        // Get current information of account A
        currAccountA = _C(exchanges[0].GetAccount);
        currBalanceA = _N(currAccountA.Balance);
        currStocksA = _N(currAccountA.Stocks);

        // Get current information of account A
        currAccountB = _C(exchanges[1].GetAccount);
        currBalanceB = _N(currAccountB.Balance);
        currStocksB = _N(currAccountB.Stocks);

        LogProfit(_N(currBalanceA + currBalanceB - initBalanceA - initBalanceB));

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
    Log("Cylon Zoe shut down, see you next time...", '#FF0000');
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

function fnParseMktIdx() {
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

    Log('Welcome to Graystone Corp. ver 0.2.', '#FF0000');
    Log('This version support one coin and two markets.');
    Log('Cylon Zoe is booting up...', '#FF0000');

    // Check initial flags
    if (enMoney != true || enCoin != true || enMktA != true || enMktB != true) {
        Log('All money, coin, market A and B should be enabled. Exit...', '#FF0000');
        return;
    }

    fnParseMoneyIdx();

    fnParseCoinIdx();

    fnParseMktIdx();

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
