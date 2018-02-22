
// Version 0.4

/* Input Parameters
   Name                  Description                   Type     Default Value
   dotOfBalance          Precision of balance          number   2
   dotOfStock            Precision of stock            number   5
   delayOfMainLoop       Delay of main loop            number   500
   delayAfterTrade       Delay after trade             number   200

   initCostA             Initial cost A                number   0
   initCostB             Initial cost B                number   0

   resetData             Reset data after start        bool     false

   gapToTrade            Percentage GAP to trade       number   0.05
   gapToCP               GAP to CP                     number   0.003
   amountToTrade         Amount to trade               number   0.2
   amountToCP            Amount to CP                  number   0.1
   maxOfTry              Maximum tries                 number   5

   maxInvest             Maxinum invest                number   20000
   thHigh                Threshold high                number   0.40
   thShort               Threshold short               number   0.30
   thLong                Threshold long                number   0.15
   thLow                 Threshold low                 number   0.05
 */

// Market A
var currCostA;
var actualInvestA = 0;
var feeOfMktA = 0;

var nameOfMktA;
var typeOfStockA;
var typeOfBalanceA;
var depthA;
var depthSellA;
var depthBuyA;

var initAccountA;
var initBalanceA;
var initStocksA;

var currAccountA;
var currBalanceA;
var currStocksA;

var flagShortTradeA = 0;     // For close position
var flagLongTradeA = 0;      // For close position
var flagStopSellA = 0;
var flagStopBuyA = 0;

var countForSellA = 0;
var countForBuyA = 0;

// Market B
var currCostB;
var actualInvestB = 0;
var feeOfMktB = 0;

var nameOfMktB;
var typeOfStockB;
var typeOfBalanceB;
var depthB;
var depthSellB;
var depthBuyB;

var initAccountB;
var initBalanceB;
var initStocksB;

var currAccountB;
var currBalanceB;
var currStocksB;

var flagShortTradeB = 0;     // For close position
var flagLongTradeB = 0;      // For close position
var flagStopSellB = 0;
var flagStopBuyB = 0;

var countForSellB = 0;
var countForBuyB = 0;

// Variables
var numOfTry = 1;
var flagExit = 0;
var flagLogProfit = 0;
var initTable;
var flagTable;
var assetTable;
var profitTable;
var profitSellABuyB = 0;
var profitSellBBuyA = 0;
var beginTime;
var nowTime;
var addUpTime;
var coForCPGAP = 1;

function onexit() {
    Log('Cylon Zoe shut down, see you next time...', '#FF0000@');
}

function fnGetInitInfoFromMkt() {

    // Get initial informations from market A
    initAccountA = _C(exchanges[0].GetAccount);
    initBalanceA = _N(initAccountA.Balance);
    initStocksA = _N(initAccountA.Stocks, dotOfStock);
    nameOfMktA = _C(exchanges[0].GetName);
    typeOfStockA = _C(exchanges[0].GetCurrency);
    typeOfBalanceA = _C(exchanges[0].GetQuoteCurrency);

    // Get initial information from market B
    initAccountB = _C(exchanges[1].GetAccount);
    initBalanceB = _N(initAccountB.Balance);
    initStocksB = _N(initAccountB.Stocks, dotOfStock);
    nameOfMktB = _C(exchanges[1].GetName);
    typeOfStockB = _C(exchanges[1].GetCurrency);
    typeOfBalanceB = _C(exchanges[1].GetQuoteCurrency);
}

function fnSetPrecisionforMkt() {

    // Set precision for market A
    exchanges[0].SetPrecision(dotOfBalance, dotOfStock);

    // Set precision for market B
    exchanges[1].SetPrecision(dotOfBalance, dotOfStock);
}

function fnTradingFeeAssignment() {

    // Trading fee assignment for market A
    if ('OKCoin_EN' == nameOfMktA) {
        feeOfMktA = 0.002;
    } else if ('Bitfinex' == nameOfMktA) {
        feeOfMktA = 0.002;
    } else if ('Coinone' == nameOfMktA) {
        feeOfMktA = 0.001;
    } else if ('Bithumb' == nameOfMktA) {
        feeOfMktA = 0.0015;
    }

    // Trading fee assignment for market B
    if ('OKCoin_EN' == nameOfMktB) {
        feeOfMktB = 0.002;
    } else if ('Bitfinex' == nameOfMktB) {
        feeOfMktB = 0.002;
    } else if ('Coinone' == nameOfMktB) {
        feeOfMktB = 0.001;
    } else if ('Bithumb' == nameOfMktB) {
        feeOfMktB = 0.00075;
    }
}

function fnInitialization() {

    fnGetInitInfoFromMkt();

    // Check type of stock and balance matching
    if (typeOfStockA != typeOfStockB || typeOfBalanceA != typeOfBalanceB) {

        Log('Type of stock of balance do not match.');
        return false;
    }

    // Check type of balance for market A
    if ('OKCoin_EN' == nameOfMktA || 'Bitfinex' == nameOfMktA) {

        if ('USD' != typeOfBalanceA) {

            Log('Type of balance should be USD');
            return false;
        }

    } else if ('Coinone' == nameOfMktA || 'Bithumb' == nameOfMktA) {

        if ('KRW' != typeOfBalanceA) {

            Log('Type of balance should be KRW');
            return false;
        }
    }

    // Check type of balance for market B
    if ('OKCoin_EN' == nameOfMktB || 'Bitfinex' == nameOfMktB) {

        if ('USD' != typeOfBalanceB) {

            Log('Type of balance should be USD');
            return false;
        }

    } else if ('Coinone' == nameOfMktB || 'Bithumb' == nameOfMktB) {

        if ('KRW' != typeOfBalanceB) {

            Log('Type of balance should be KRW');
            return false;
        }
    }

    fnSetPrecisionforMkt();

    fnTradingFeeAssignment();

    Log(nameOfMktA, '| Initial', typeOfBalanceA, ':', initBalanceA,
            '| Initial', typeOfStockA, ':', initStocksA, '| Trade Fee:', feeOfMktA);
    Log(nameOfMktB, '| Initial', typeOfBalanceB, ':', initBalanceB,
            '| Initial', typeOfStockB, ':', initStocksB, '| Trade Fee:', feeOfMktB);
}

function fnGetDepthForMkts() {

    // Depth for market A
    depthA = _C(exchanges[0].GetDepth);
    depthSellA = _N(depthA.Asks[0].Price);
    depthBuyA = _N(depthA.Bids[0].Price);

    if (0 == currCostA) {
        currCostA = _N((depthSellA + depthBuyA) / 2);
        Log('Set initial Current cost of', nameOfMktA, 'to', currCostA);
        initCostA = currCostA;
    }

    // Depth for market B
    depthB = _C(exchanges[1].GetDepth);
    depthSellB = _N(depthB.Asks[0].Price);
    depthBuyB = _N(depthB.Bids[0].Price);

    if (0 == currCostB) {
        currCostB = _N((depthSellB + depthBuyB) / 2);
        Log('Set initial Current cost of', nameOfMktB, 'to', currCostB);
        initCostB = currCostB;
    }
}

function fnGetCurrInfoFromMkt() {

    // Get current informations from market A
    currAccountA = _C(exchanges[0].GetAccount);
    currBalanceA = _N(currAccountA.Balance);
    currStocksA = _N(currAccountA.Stocks, dotOfStock);

    // Get current informations from market B
    currAccountB = _C(exchanges[1].GetAccount);
    currBalanceB = _N(currAccountB.Balance);
    currStocksB = _N(currAccountB.Stocks, dotOfStock);
}

function fnDirectionalFlagCheck() {

    // For Market A
    if (_N(currCostA * currStocksA + currBalanceA) < maxInvest) {

        // Money and coin is less than maximum invest
        actualInvestA = _N(currCostA * currStocksA + currBalanceA);

    } else if (_N(currCostA * currStocksA + currBalanceA) >= maxInvest) {

        // Money and coin is equal or more than maximum invest
        actualInvestA = maxInvest;
    }

    if (_N(currCostA * currStocksA / actualInvestA) >= thHigh) {

        // Coin is more than threshold high
        flagStopBuyA = 1;
        flagShortTradeA = 1;
        flagLongTradeA = 0;
        flagStopSellA = 0;

    } else if (_N(currCostA * currStocksA / actualInvestA) > thShort) {

        // Coin is more than threshold short but less than threshold high
        flagStopBuyA = 0;
        flagShortTradeA = 1;
        flagLongTradeA = 0;
        flagStopSellA = 0;

    } else if (_N(currCostA * currStocksA / actualInvestA) <= thShort &&
            _N(currCostA * currStocksA / actualInvestA) >= thLong) {

        // Coin is more than threshold long but less than threshold short
        flagStopBuyA = 0;
        flagShortTradeA = 0;
        flagLongTradeA = 0;
        flagStopSellA = 0;

    } else if (_N(currCostA * currStocksA / actualInvestA) < thLong &&
            _N(currCostA * currStocksA / actualInvestA) > thLow) {

        // Coin is more than threshold low but less than threshold long
        flagStopBuyA = 0;
        flagShortTradeA = 0;
        flagLongTradeA = 1;
        flagStopSellA = 0;

    } else {

        // Coin is less than threshold low
        flagStopBuyA = 0;
        flagShortTradeA = 0;
        flagLongTradeA = 1;
        flagStopSellA = 1;
    }

    // For Market B
    if (_N(currCostB * currStocksB + currBalanceB) < maxInvest) {

        // Money and coin is less than maximum invest
        actualInvestB = _N(currCostB * currStocksB + currBalanceB);

    } else if (_N(currCostB * currStocksB + currBalanceB) >= maxInvest) {

        // Money and coin is equal or more than maximum invest
        actualInvestB = maxInvest;
    }

    if (_N(currCostB * currStocksB / actualInvestB) >= thHigh) {

        // Coin is more than threshold high
        flagStopBuyB = 1;
        flagShortTradeB = 1;
        flagLongTradeB = 0;
        flagStopSellB = 0;

    } else if (_N(currCostB * currStocksB / actualInvestB) > thShort) {

        // Coin is more than threshold short but less than threshold high
        flagStopBuyB = 0;
        flagShortTradeB = 1;
        flagLongTradeB = 0;
        flagStopSellB = 0;

    } else if (_N(currCostB * currStocksB / actualInvestB) <= thShort &&
            _N(currCostB * currStocksB / actualInvestB) >= thLong) {

        // Coin is more than threshold long but less than threshold short
        flagStopBuyB = 0;
        flagShortTradeB = 0;
        flagLongTradeB = 0;
        flagStopSellB = 0;

    } else if (_N(currCostB * currStocksB / actualInvestB) < thLong &&
            _N(currCostB * currStocksB / actualInvestB) > thLow) {

        // Coin is more than threshold low but less than threshold long
        flagStopBuyB = 0;
        flagShortTradeB = 0;
        flagLongTradeB = 1;
        flagStopSellB = 0;

    } else {

        // Coin is less than threshold low
        flagStopBuyB = 0;
        flagShortTradeB = 0;
        flagLongTradeB = 1;
        flagStopSellB = 1;
    }

    flagTable = {type: 'table',
        title: 'Flag Status',
        cols: ['Tries', 'Market', 'Curr Bal', 'Curr Stock', 'Actual Invest', 'Stop Sell', 'Long Trade', 'Short Trade', 'Stop Buy', 'Sell Count', 'Buy Count'],
        rows: [
            [numOfTry, nameOfMktA, currBalanceA, currStocksA, actualInvestA, flagStopSellA, flagLongTradeA, flagShortTradeA, flagStopBuyA, countForSellA, countForBuyA],
            [numOfTry, nameOfMktB, currBalanceB, currStocksB, actualInvestB, flagStopSellB, flagLongTradeB, flagShortTradeB, flagStopBuyB, countForSellB, countForBuyB]
        ]
    };
}

function fnPerformClosePosition() {

    // For Market A
    if (1 != flagLongTradeA && 1 != flagStopSellA && currCostA < _N(depthBuyA * (1 - feeOfMktA) * (1 - gapToCP * (1 + coForCPGAP * countForSellA)), 5)) {

        // Sell A
        //if (currCostA < _N(depthBuyA * (1 - feeOfMktA), 5)) {
        //}

        Log(nameOfMktA, ': Close position needed. Current cost before selling is', currCostA, '#FF0000');

        if (currStocksA >= amountToCP) {

            addUpTime = 0;
            while (null == exchanges[0].Sell(depthBuyA, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                //Log('Retry at', nameOfMktA, 'after', delayAfterTrade, 'ms');
                Sleep(delayAfterTrade);

                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by selling from', nameOfMktA, 'at', depthBuyA, 'GAP is ', gapToCP * (1 + coForCPGAP * countForSellA), '@');
                //Log('Close position by selling from', nameOfMktA, 'at', depthBuyA);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForSellA++;
                countForBuyA = 0;

                // Cost A after selling
                currCostA = _N((currCostA * currStocksA -
                            depthBuyA * amountToCP * (1 - feeOfMktA)) / (
                            currStocksA - amountToCP), 5);

                Log(nameOfMktA, ': Close position finished. Current cost after selling is', currCostA, '#FF0000');

            } else {
                Log(nameOfMktA, ': Close position canceled.');
            }
        }

    } else if (1 != flagShortTradeA && 1 != flagStopBuyA && currCostA > _N(depthSellA * (1 + feeOfMktA) * (1 + gapToCP * (1 + coForCPGAP * countForBuyA)), 5)) {

        // Buy A
        //if (currCostA > _N(depthSellA * (1 + feeOfMktA), 5)) {
        //}

        Log(nameOfMktA, ': Close position needed. Current cost before buying is', currCostA, '#FF0000');

        if (currBalanceA >= _N(depthSellA * amountToCP)) {

            addUpTime = 0;
            while (null == exchanges[0].Buy(depthSellA, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                //Log('Retry at', nameOfMktA, 'after', delayAfterTrade, 'ms');
                Sleep(delayAfterTrade);

                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by buying from', nameOfMktA, 'at', depthSellA, 'GAP is ', gapToCP * (1 + coForCPGAP * countForBuyA), '@');
                //Log('Close position by buying from', nameOfMktA, 'at', depthSellA);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForBuyA++;
                countForSellA = 0;

                // Cost A after buying
                currCostA = _N((currCostA * currStocksA +
                            depthSellA * amountToCP) / (currStocksA +
                                amountToCP * (1 - feeOfMktA)), 5);

                Log(nameOfMktA, ': Close position finished. Current cost after buying is', currCostA, '#FF0000');

            } else {
                Log(nameOfMktA, ': Close position canceled.');
            }
        }
    }

    // For Market B
    if (1 != flagLongTradeB && 1 != flagStopSellB && currCostB < _N(depthBuyB * (1 - feeOfMktB) * (1 - gapToCP * (1 + coForCPGAP * countForSellB)), 5)) {

        // Sell B
        //if (currCostB < _N(depthBuyB * (1 - feeOfMktB), 5)) {
        //}

        Log(nameOfMktB, ': Close position needed. Current cost before selling is', currCostB, '#FF0000');

        if (currStocksB >= amountToCP) {

            addUpTime = 0;
            while (null == exchanges[1].Sell(depthBuyB, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                //Log('Retry at', nameOfMktB, 'after', delayAfterTrade, 'ms');
                Sleep(delayAfterTrade);

                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by selling from', nameOfMktB, 'at', depthBuyB, 'GAP is ', gapToCP * (1 + coForCPGAP * countForSellB), '@');
                //Log('Close position by selling from', nameOfMktB, 'at', depthBuyB);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForSellB++;
                countForBuyB = 0;

                // Cost B after selling
                currCostB = _N((currCostB * currStocksB -
                            depthBuyB * amountToCP * (1 - feeOfMktB)) / (
                            currStocksB - amountToCP), 5);

                Log(nameOfMktB, ': Close position finished. Current cost after selling is', currCostB, '#FF0000');

            } else {
                Log(nameOfMktB, ': Close position canceled.');
            }
        }

    } else if (1 != flagShortTradeB && 1 != flagStopBuyB && currCostB > _N(depthSellB * (1 + feeOfMktB) * (1 + gapToCP * (1 + coForCPGAP * countForBuyB)), 5)) {

        // Buy B
        //if (currCostB > _N(depthSellB * (1 + feeOfMktB), 5)) {
        //}

        Log(nameOfMktB, ': Close position needed. Current cost before buying is', currCostB, '#FF0000');

        if (currBalanceB >= _N(depthSellB * amountToCP)) {

            addUpTime = 0;
            while (null == exchanges[1].Buy(depthSellB, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                //Log('Retry at', nameOfMktB, 'after', delayAfterTrade, 'ms');
                Sleep(delayAfterTrade);

                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by buying from', nameOfMktB, 'at', depthSellB, 'GAP is ', gapToCP * (1 + coForCPGAP * countForBuyB), '@');
                //Log('Close position by buying from', nameOfMktB, 'at', depthSellB);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForBuyB++;
                countForSellB = 0;

                // Cost B after buying
                currCostB = _N((currCostB * currStocksB +
                            depthSellB * amountToCP) / (currStocksB +
                                amountToCP * (1 - feeOfMktB)), 5);

                Log(nameOfMktB, ': Close position finished. Current cost after buying is', currCostB, '#FF0000');

            } else {
                Log(nameOfMktB, ': Close position canceled.');
            }
        }
    }
}

function fnCompForSellABuyB() {

    if (1 == flagStopSellA || 1 == flagStopBuyB) {
        //Log('StopSellA[', flagStopSellA, '], StopBuyB[', flagStopBuyB, ']. Skip...');
        return false;
    }

    var potentialIncome = 0;
    var potentialOutgo = 0;

    potentialIncome = _N(depthBuyA * (1 - feeOfMktA), 5);
    potentialOutgo = _N(depthSellB * (1 + feeOfMktB), 5);

    if (potentialIncome <= potentialOutgo) {

        // No chance for arbitrage
        return false;
    }

    profitSellABuyB = _N((potentialIncome / potentialOutgo - 1) * 100, 5);

    if (profitSellABuyB < gapToTrade) {

        Log(profitSellABuyB, '% is not enough for arbitrage...');
        return false;
    }

    if (currStocksA < amountToTrade) {
        Log(nameOfMktA, ':', 'Not enough stock to trade. Skip...');
        return false;
    }

    if (currBalanceB < _N(potentialOutgo * amountToTrade)) {
        Log(nameOfMktB, ':', 'Not enough money to trade. Skip...');
        return false;
    }

    return true;
}

function fnTradeForSellABuyB() {

    addUpTime = 0;
    while (null == exchanges[0].Sell(depthBuyA, amountToTrade)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

        //Log('Retry at', nameOfMktA, 'after', delayAfterTrade, 'ms');
        Sleep(delayAfterTrade);

        addUpTime += delayAfterTrade;
    }

    addUpTime = 0;
    while (null == exchanges[1].Buy(depthSellB, amountToTrade)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

        //Log('Retry at', nameOfMktB, 'after', delayAfterTrade, 'ms');
        Sleep(delayAfterTrade);

        addUpTime += delayAfterTrade;
    }

    Sleep(delayAfterTrade);
    flagLogProfit = 1;
    countForSellA++;
    countForBuyA = 0;
    countForBuyB++;
    countForSellB = 0;

    Log(nameOfMktA, ': Current cost before selling is', currCostA, '#FF0000');
    Log(nameOfMktB, ': Current cost before buying is', currCostB, '#FF0000');

    // Cost A after selling
    currCostA = _N((currCostA * currStocksA -
                depthBuyA * amountToTrade * (1 - feeOfMktA)) / (
                currStocksA - amountToTrade), 5);

    // Cost B after buying
    currCostB = _N((currCostB * currStocksB +
                depthSellB * amountToTrade) / (currStocksB +
                    amountToTrade * (1 - feeOfMktB)), 5);

    Log(nameOfMktA, ': Current cost after selling is', currCostA, '#FF0000');
    Log(nameOfMktB, ': Current cost after buying is', currCostB, '#FF0000');

    Log('Finished selling from', nameOfMktA, 'at', depthBuyA, 'and buying from', nameOfMktB, 'at', depthSellB, '@');
    //Log('Finished selling from', nameOfMktA, 'at', depthBuyA, 'and buying from', nameOfMktB, 'at', depthSellB);
}

function fnCompForSellBBuyA() {

    if (1 == flagStopSellB || 1 == flagStopBuyA) {
        //Log('StopSellB[', flagStopSellB, '], StopBuyA[', flagStopBuyA, ']. Skip...');
        return false;
    }

    var potentialIncome = 0;
    var potentialOutgo = 0;

    potentialIncome = _N(depthBuyB * (1 - feeOfMktB), 5);
    potentialOutgo = _N(depthSellA * (1 + feeOfMktA), 5);

    if (potentialIncome <= potentialOutgo) {

        // No chance for arbitrage
        return false;
    }

    profitSellBBuyA = _N((potentialIncome / potentialOutgo - 1) * 100, 5);

    if (profitSellBBuyA < gapToTrade) {

        Log(profitSellBBuyA, '% is not enough for arbitrage...');
        return false;
    }

    if (currStocksB < amountToTrade) {
        Log(nameOfMktB, ':', 'Not enough stock to trade. Skip...');
        return false;
    }

    if (currBalanceA < _N(potentialOutgo * amountToTrade)) {
        Log(nameOfMktA, ':', 'Not enough money to trade. Skip...');
        return false;
    }

    return true;
}

function fnTradeForSellBBuyA() {

    addUpTime = 0;
    while (null == exchanges[1].Sell(depthBuyB, amountToTrade)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

        //Log('Retry at', nameOfMktB, 'after', delayAfterTrade, 'ms');
        Sleep(delayAfterTrade);

        addUpTime += delayAfterTrade;
    }

    addUpTime = 0;
    while (null == exchanges[0].Buy(depthSellA, amountToTrade)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

        //Log('Retry at', nameOfMktA, 'after', delayAfterTrade, 'ms');
        Sleep(delayAfterTrade);

        addUpTime += delayAfterTrade;
    }

    Sleep(delayAfterTrade);
    flagLogProfit = 1;
    countForSellB++;
    countForBuyB = 0;
    countForBuyA++;
    countForSellA = 0;

    Log(nameOfMktB, ': Current cost before selling is', currCostB, '#FF0000');
    Log(nameOfMktA, ': Current cost before buying is', currCostA, '#FF0000');

    // Cost B after selling
    currCostB = _N((currCostB * currStocksB -
                depthBuyB * amountToTrade * (1 - feeOfMktB)) / (
                currStocksB - amountToTrade), 5);

    // Cost A after buying
    currCostA = _N((currCostA * currStocksA +
                depthSellA * amountToTrade) / (currStocksA +
                    amountToTrade * (1 - feeOfMktA)), 5);

    Log(nameOfMktB, ': Current cost after selling is', currCostB, '#FF0000');
    Log(nameOfMktA, ': Current cost after buying is', currCostA, '#FF0000');

    Log('Finished selling from', nameOfMktB, 'at', depthBuyB, 'and buying from', nameOfMktA, 'at', depthSellA, '@');
    //Log('Finished selling from', nameOfMktB, 'at', depthBuyB, 'and buying from', nameOfMktA, 'at', depthSellA);
}

function onTick() {

    flagLogProfit = 0;

    nowTime = new Date().getTime();
    nowTime = _D(nowTime, fmt='yyyy-MM-dd hh:mm:ss');

    profitSellABuyB = 0;
    profitSellBBuyA = 0;

    // Get depth price
    fnGetDepthForMkts();

    // Get current account information for close position
    fnGetCurrInfoFromMkt();

    // Check directional flags for close position
    fnDirectionalFlagCheck();

    // Close position
    fnPerformClosePosition();

    // Get current account information again for hedge trade
    fnGetCurrInfoFromMkt();

    // Check directional flags again for hedge trade
    fnDirectionalFlagCheck();

    if (true == fnCompForSellABuyB()) {

        fnTradeForSellABuyB();
    }

    if (true == fnCompForSellBBuyA()) {

        fnTradeForSellBBuyA();
    }

    // Get current account information for profit logging
    fnGetCurrInfoFromMkt();

    if (1 == flagLogProfit) {
        LogProfit(_N(currBalanceA + currBalanceB - initBalanceA - initBalanceB));
    }

    assetTable = {type: 'table',
        title: 'Asset Status',
        cols: ['Tries', 'Market', 'Init Bal', 'Init Stock', 'Init Cost', 'Curr Bal', 'Curr Stock', 'Curr Cost', 'Bal Profit %', 'Total Profit %'],
        rows: [
            [numOfTry, nameOfMktA, initBalanceA, initStocksA, initCostA, currBalanceA, currStocksA, currCostA, _N((currBalanceA / initBalanceA - 1) * 100), _N((((currBalanceA + currStocksA * (depthSellA + depthBuyA) / 2) / (initBalanceA + initStocksA * initCostA)) - 1) * 100)],
            [numOfTry, nameOfMktB, initBalanceB, initStocksB, initCostB, currBalanceB, currStocksB, currCostB, _N((currBalanceB / initBalanceB - 1) * 100), _N((((currBalanceB + currStocksB * (depthSellB + depthBuyB) / 2) / (initBalanceB + initStocksB * initCostB)) - 1) * 100)],
            ['Initial Asset:', _N(initBalanceA + initStocksA * initCostA + initBalanceB + initStocksB * initCostB), ' ', 'at', beginTime],
            ['Current Asset:', _N(currBalanceA + currStocksA * (depthSellA + depthBuyA) / 2 + currBalanceB + currStocksB * (depthSellB + depthBuyB) / 2), ' ', 'at', nowTime],
            ['Total growth:', _N(((currBalanceA + currStocksA * (depthSellA + depthBuyA) / 2 + currBalanceB + currStocksB * (depthSellB + depthBuyB) / 2) / (initBalanceA + initStocksA * initCostA + initBalanceB + initStocksB * initCostB) - 1) * 100, 4), '%'],
            ['Bithumb', '0.00075', 'coupon', 'period:', '2018-01-28 12:56', '~', '2018-02-27 12:56']
        ]
    };

    profitTable = {type: 'table',
        title: 'Price Status',
        cols: ['Tries', 'Sell From', 'At Price', 'Buy From', 'At Price', 'Profit %', 'Target Profit %', 'Result'],
        rows: [
            [numOfTry, nameOfMktA, depthBuyA, nameOfMktB, depthSellB, profitSellABuyB, gapToTrade, profitSellABuyB > gapToTrade ? 'Enough' : 'Not Enough'],
            [numOfTry, nameOfMktB, depthBuyB, nameOfMktA, depthSellA, profitSellBBuyA, gapToTrade, profitSellBBuyA > gapToTrade ? 'Enough' : 'Not Enough']
        ]
    };

    LogStatus('`' + JSON.stringify([assetTable, flagTable, profitTable, initTable]) + '`');
}

function main() {
    if (resetData) {
        LogProfitReset();
        LogReset();
    }

    Log('Welcome to Graystone Corp.', '#FF0000');
    Log('This version support one coin and two markets within BCH|BTC|ETC|ETH|LTC and OKCoin_EN|Bitfinex|Coinone|Bithumb.', '#FF0000');
    Log('Cylon Zoe ver 0.4 is booting up in 3...2...1... Okay, Sexy! Let me show you some tables...', '#FF0000@');
    Sleep(3000);

    beginTime = new Date().getTime();
    beginTime = _D(beginTime, fmt='yyyy-MM-dd hh:mm:ss');

    // Current cost will be set if original cost is 0
    currCostA = initCostA;
    currCostB = initCostB;

    // Initialization
    if (false == fnInitialization()) {
        Log('Initialization failed, exiting...', '#FF0000');
        return;
    }

    initTable = {type: 'table',
        title: 'Parameters',
        cols: ['Item', 'Type', 'Value'],
        rows: [
            ['Precision of balance', 'number', dotOfBalance],
            ['Precision of stock', 'number', dotOfStock],
            ['Delay of main loop', 'number', delayOfMainLoop],
            ['Delay after trade', 'number', delayAfterTrade],
            ['Initial cost A', 'number', initCostA],
            ['Initial cost B', 'number', initCostB],
            ['Reset data after start', 'bool', resetData],
            ['Percentage GAP to trade', 'number', gapToTrade],
            ['GAP to close position', 'number', gapToCP],
            ['Amount to trade', 'number', amountToTrade],
            ['Amount to close position', 'number', amountToCP],
            ['Maximum tries', 'number', 0 == maxOfTry ? 'Infinite' : maxOfTry],
            ['Maxinum invest', 'number', maxInvest],
            ['Threshold high', 'number', thHigh],
            ['Threshold short', 'number', thShort],
            ['Threshold long', 'number', thLong],
            ['Threshold low', 'number', thLow]
        ]
    };

    // Main loop
    while (true) {
        //Log('Main Loop, try', numOfTry);
        onTick();

        if (numOfTry >= maxOfTry && 0 != maxOfTry || 1 == flagExit) {
            return;
        }

        numOfTry++;
        Sleep(delayOfMainLoop);
    }
}
