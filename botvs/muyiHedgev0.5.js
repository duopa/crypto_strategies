
// Version 0.5

/* Input Parameters
   Name                  Description                       Type     Default Value
   dotOfBalance          Precision of balance              number   2
   dotOfStock            Precision of stock                number   5
   delayOfMainLoop       Delay of main loop                number   500
   delayAfterTrade       Delay after trade                 number   200

   resetData             Reset data after start            bool     false
   maxOfTry              Maximum tries                     number   5
   cntForCostADJ         Count for cost adjustment         number   1000

   gapToHedge            GAP to hedge                      number   0.001
   amountToHedge         Amount to hedge                   number   0.2

   gapToCP               GAP to CP                         number   0.01
   amountToCP            Amount to CP                      number   0.1

   maxInvest             Maxinum invest                    number   20000
   thLongPosition        Threshold of long position        number   0.40
   thShortTrade          Threshold to short trade          number   0.30
   thLongTrade           Threshold to long trade           number   0.15
   thShortPosition       Threshold of short position       number   0.05
 */

// Market A
var initCostA = 0;           // Must set to 0
var initAssetA;

var currCostA;
var currAssetA;

var actualInvestA = 0;
var feeOfMktA = 0;

var nameOfMktA;
var typeOfStockA;
var typeOfBalanceA;

var depthAvgPriceA;
var depthSellPriceA;
var depthSellAmountA;
var depthBuyPriceA;
var depthBuyAmountA;

var initAccountA;
var initBalanceA;
var initStocksA;

var currAccountA;
var currBalanceA;
var currStocksA;
var currPositionA;

var flagShortTradeA = 0;     // Direction for close position
var flagLongTradeA = 0;      // Direction for close position

var countForSellA = 0;
var countForBuyA = 0;

var gapCPSellA = 1;
var gapCPBuyA = 1;

// Market B
var initCostB = 0;           // Must set to 0
var initAssetB;

var currCostB;
var currAssetB;

var actualInvestB = 0;
var feeOfMktB = 0;

var nameOfMktB;
var typeOfStockB;
var typeOfBalanceB;

var depthAvgPriceB;
var depthSellPriceB;
var depthSellAmountB;
var depthBuyPriceB;
var depthBuyAmountB;

var initAccountB;
var initBalanceB;
var initStocksB;

var currAccountB;
var currBalanceB;
var currStocksB;
var currPositionB;

var flagShortTradeB = 0;     // Direction for close position
var flagLongTradeB = 0;      // Direction for close position

var countForSellB = 0;
var countForBuyB = 0;

var gapCPSellB = 1;
var gapCPBuyB = 1;

// Variables
var numOfTry = 1;
var realCntForCostADJ;

var flagExit = 0;
var flagLogProfit = 0;

var initTable;
var flagTable;
var assetTable;
var profitTable;

var pctGAPSellABuyB;
var pctGAPSellBBuyA;
var pctProfitSellABuyB = 0;
var pctProfitSellBBuyA = 0;

var beginTime;
var nowTime;
var addUpTime;

var initTotalAsset;
var currTotalAsset;

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
        feeOfMktA = 0.00075;
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

        Log('Type of stock or balance do not match.');
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
    var depthA = _C(exchanges[0].GetDepth);
    depthSellPriceA = _N(depthA.Asks[0].Price);
    depthSellAmountA = _N(depthA.Asks[0].Amount);
    depthBuyPriceA = _N(depthA.Bids[0].Price);
    depthBuyAmountA = _N(depthA.Bids[0].Amount);
    depthAvgPriceA = _N((depthSellPriceA + depthBuyPriceA) / 2);

    if (0 == currCostA) {
        currCostA = depthAvgPriceA;
        Log('Set initial Current cost of', nameOfMktA, 'to', currCostA);
        initCostA = currCostA;
        initAssetA = _N(initBalanceA + initStocksA * initCostA);
    }

    // Depth for market B
    var depthB = _C(exchanges[1].GetDepth);
    depthSellPriceB = _N(depthB.Asks[0].Price);
    depthSellAmountB = _N(depthB.Asks[0].Amount);
    depthBuyPriceB = _N(depthB.Bids[0].Price);
    depthBuyAmountB = _N(depthB.Bids[0].Amount);
    depthAvgPriceB = _N((depthSellPriceB + depthBuyPriceB) / 2);

    if (0 == currCostB) {
        currCostB = depthAvgPriceB;
        Log('Set initial Current cost of', nameOfMktB, 'to', currCostB);
        initCostB = currCostB;
        initAssetB = _N(initBalanceB + initStocksB * initCostB);
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

function fnPositionFlagCheck() {

    // For Market A
    if (_N(currCostA * currStocksA + currBalanceA) < maxInvest) {

        // Money and coin is less than maximum invest
        actualInvestA = _N(currCostA * currStocksA + currBalanceA);

    } else if (_N(currCostA * currStocksA + currBalanceA) >= maxInvest) {

        // Money and coin is equal or more than maximum invest
        actualInvestA = maxInvest;
    }

    currPositionA = _N(currCostA * currStocksA / actualInvestA);

    if (currPositionA > thShortTrade) {

        // Short trade
        flagShortTradeA = 1;
        flagLongTradeA = 0;

    } else if (currPositionA <= thShortTrade && currPositionA >= thLongTrade) {

        // Free zone
        flagShortTradeA = 0;
        flagLongTradeA = 0;

    } else if (currPositionA < thLongTrade) {

        // Long trade
        flagShortTradeA = 0;
        flagLongTradeA = 1;
    }

    // For Market B
    if (_N(currCostB * currStocksB + currBalanceB) < maxInvest) {

        // Money and coin is less than maximum invest
        actualInvestB = _N(currCostB * currStocksB + currBalanceB);

    } else if (_N(currCostB * currStocksB + currBalanceB) >= maxInvest) {

        // Money and coin is equal or more than maximum invest
        actualInvestB = maxInvest;
    }

    currPositionB = _N(currCostB * currStocksB / actualInvestA);

    if (currPositionB > thShortTrade) {

        // Short trade
        flagShortTradeB = 1;
        flagLongTradeB = 0;

    } else if (currPositionB <= thShortTrade && currPositionB >= thLongTrade) {

        // Free zone
        flagShortTradeB = 0;
        flagLongTradeB = 0;

    } else if (currPositionB < thLongTrade) {

        // Long trade
        flagShortTradeB = 0;
        flagLongTradeB = 1;
    }

    flagTable = {type: 'table',
        title: 'Flag Status',
        cols: ['Tries', 'Market', 'Actual Invest', 'Curr Bal', 'Curr Stock', 'Position %', 'Long Trade', 'Short Trade', 'Sell Count', 'Buy Count'],
        rows: [
            [numOfTry, nameOfMktA, actualInvestA, currBalanceA, currStocksA, currPositionA * 100, flagLongTradeA, flagShortTradeA, countForSellA, countForBuyA],
            [numOfTry, nameOfMktB, actualInvestB, currBalanceB, currStocksB, currPositionB * 100, flagLongTradeB, flagShortTradeB, countForSellB, countForBuyB]
        ]
    };
}

function fnPerformClosePosition() {

    // For Market A
    gapCPSellA = gapToCP * (1 + countForSellA);
    gapCPBuyA = gapToCP * (1 + countForBuyA);

    if (1 != flagLongTradeA && currCostA < _N(depthBuyPriceA * (1 - feeOfMktA) * (1 - gapCPSellA), 5)) {

        // Sell A
        Log(nameOfMktA, ': Close position needed. Current cost before selling is', currCostA, '#FF0000');

        if (currStocksA >= amountToCP && depthBuyAmountA >= amountToCP) {

            addUpTime = 0;
            while (null == exchanges[0].Sell(depthBuyPriceA, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                Sleep(delayAfterTrade);
                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by selling from', nameOfMktA, 'at', depthBuyPriceA, 'GAP is ', gapCPSellA);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForSellA++;
                countForBuyA = 0;

                // Cost A after selling
                currCostA = _N((currCostA * currStocksA -
                            depthBuyPriceA * amountToCP * (1 - feeOfMktA)) / (
                            currStocksA - amountToCP), 5);

                Log(nameOfMktA, ': Close position finished. Current cost after selling is', currCostA, '#FF0000');

            } else {
                Log(nameOfMktA, ': Close position canceled.');
            }
        }

    } else if (1 != flagShortTradeA && currCostA > _N(depthSellPriceA * (1 + feeOfMktA) * (1 + gapCPBuyA), 5)) {

        // Buy A
        Log(nameOfMktA, ': Close position needed. Current cost before buying is', currCostA, '#FF0000');

        if (currBalanceA >= _N(depthSellPriceA * amountToCP) && depthSellAmountA >= amountToCP) {

            addUpTime = 0;
            while (null == exchanges[0].Buy(depthSellPriceA, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                Sleep(delayAfterTrade);
                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by buying from', nameOfMktA, 'at', depthSellPriceA, 'GAP is ', gapCPBuyA);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForBuyA++;
                countForSellA = 0;

                // Cost A after buying
                currCostA = _N((currCostA * currStocksA +
                            depthSellPriceA * amountToCP) / (currStocksA +
                                amountToCP * (1 - feeOfMktA)), 5);

                Log(nameOfMktA, ': Close position finished. Current cost after buying is', currCostA, '#FF0000');

            } else {
                Log(nameOfMktA, ': Close position canceled.');
            }
        }
    }

    // For Market B
    gapCPSellB = gapToCP * (1 + countForSellB);
    gapCPBuyB = gapToCP * (1 + countForBuyB);


    if (1 != flagLongTradeB && currCostB < _N(depthBuyPriceB * (1 - feeOfMktB) * (1 - gapCPSellB), 5)) {

        // Sell B
        Log(nameOfMktB, ': Close position needed. Current cost before selling is', currCostB, '#FF0000');

        if (currStocksB >= amountToCP && depthBuyAmountB >= amountToCP) {

            addUpTime = 0;
            while (null == exchanges[1].Sell(depthBuyPriceB, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                Sleep(delayAfterTrade);
                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by selling from', nameOfMktB, 'at', depthBuyPriceB, 'GAP is ', gapCPSellB);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForSellB++;
                countForBuyB = 0;

                // Cost B after selling
                currCostB = _N((currCostB * currStocksB -
                            depthBuyPriceB * amountToCP * (1 - feeOfMktB)) / (
                            currStocksB - amountToCP), 5);

                Log(nameOfMktB, ': Close position finished. Current cost after selling is', currCostB, '#FF0000');

            } else {
                Log(nameOfMktB, ': Close position canceled.');
            }
        }

    } else if (1 != flagShortTradeB && currCostB > _N(depthSellPriceB * (1 + feeOfMktB) * (1 + gapCPBuyB), 5)) {

        // Buy B
        Log(nameOfMktB, ': Close position needed. Current cost before buying is', currCostB, '#FF0000');

        if (currBalanceB >= _N(depthSellPriceB * amountToCP) && depthSellAmountB >= amountToCP) {

            addUpTime = 0;
            while (null == exchanges[1].Buy(depthSellPriceB, amountToCP)) {

                if (10000 < addUpTime) {
                    Log('Break for next after retrying for more than 10 seconds');
                    break;
                }

                Sleep(delayAfterTrade);
                addUpTime += delayAfterTrade;
            }

            if (10000 >= addUpTime) {
                Log('Close position by buying from', nameOfMktB, 'at', depthSellPriceB, 'GAP is ', gapCPBuyB);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForBuyB++;
                countForSellB = 0;

                // Cost B after buying
                currCostB = _N((currCostB * currStocksB +
                            depthSellPriceB * amountToCP) / (currStocksB +
                                amountToCP * (1 - feeOfMktB)), 5);

                Log(nameOfMktB, ': Close position finished. Current cost after buying is', currCostB, '#FF0000');

            } else {
                Log(nameOfMktB, ': Close position canceled.');
            }
        }
    }
}

function fnCompForSellABuyB() {

    if (currPositionA <= thShortPosition || currPositionB >= thLongPosition) {

        // Quadruple hedging GAP
        pctGAPSellABuyB = (gapToHedge * 4) * 100;

    } else if (1 == flagLongTradeA || 1 == flagShortTradeB) {

        // Double hedging GAP
        pctGAPSellABuyB = (gapToHedge * 2) * 100;

    } else {

        // Normal hedging GAP
        pctGAPSellABuyB = gapToHedge * 100;
    }

    var potentialIncomeByPrice = 0;
    var potentialOutgoByPrice = 0;

    potentialIncomeByPrice = _N(depthBuyPriceA * (1 - feeOfMktA), 5);
    potentialOutgoByPrice = _N(depthSellPriceB * (1 + feeOfMktB), 5);

    if (potentialIncomeByPrice <= potentialOutgoByPrice) {

        // No chance for arbitrage
        return false;
    }

    pctProfitSellABuyB = _N((potentialIncomeByPrice / potentialOutgoByPrice - 1) * 100, 5);

    if (pctProfitSellABuyB < pctGAPSellABuyB) {

        //Log(pctProfitSellABuyB, '% is not enough for arbitrage...');
        return false;
    }

    if (currStocksA < amountToHedge) {
        Log(nameOfMktA, ':', 'Not enough stock to trade. Skip...');
        return false;
    }

    if (currBalanceB < _N(potentialOutgoByPrice * amountToHedge)) {
        Log(nameOfMktB, ':', 'Not enough money to trade. Skip...');
        return false;
    }

    if (depthBuyAmountA < amountToHedge || depthSellAmountB < amountToHedge) {
        Log('Not enough depth amount to trade.', nameOfMktA, '[', depthBuyAmountA, ']', nameOfMktB, '[', depthSellAmountB, ']', 'Skip...');
        return false;
    }

    return true;
}

function fnTradeForSellABuyB() {

    addUpTime = 0;
    while (null == exchanges[0].Sell(depthBuyPriceA, amountToHedge)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

        Sleep(delayAfterTrade);
        addUpTime += delayAfterTrade;
    }

    addUpTime = 0;
    while (null == exchanges[1].Buy(depthSellPriceB, amountToHedge)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

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
                depthBuyPriceA * amountToHedge * (1 - feeOfMktA)) / (
                currStocksA - amountToHedge), 5);

    // Cost B after buying
    currCostB = _N((currCostB * currStocksB +
                depthSellPriceB * amountToHedge) / (currStocksB +
                    amountToHedge * (1 - feeOfMktB)), 5);

    Log(nameOfMktA, ': Current cost after selling is', currCostA, '#FF0000');
    Log(nameOfMktB, ': Current cost after buying is', currCostB, '#FF0000');
    Log('Finished selling from', nameOfMktA, 'at', depthBuyPriceA, 'and buying from', nameOfMktB, 'at', depthSellPriceB);
}

function fnCompForSellBBuyA() {

    if (currPositionB <= thShortPosition || currPositionA >= thLongPosition) {

        // Quadruple hedging GAP
        pctGAPSellBBuyA = (gapToHedge * 4) * 100;

    } else if (1 == flagLongTradeB || 1 == flagShortTradeA) {

        // Double hedging GAP
        pctGAPSellBBuyA = (gapToHedge * 2) * 100;

    } else {

        // Normal trading GAP
        pctGAPSellBBuyA = gapToHedge * 100;
    }

    var potentialIncomeByPrice = 0;
    var potentialOutgoByPrice = 0;

    potentialIncomeByPrice = _N(depthBuyPriceB * (1 - feeOfMktB), 5);
    potentialOutgoByPrice = _N(depthSellPriceA * (1 + feeOfMktA), 5);

    if (potentialIncomeByPrice <= potentialOutgoByPrice) {

        // No chance for arbitrage
        return false;
    }

    pctProfitSellBBuyA = _N((potentialIncomeByPrice / potentialOutgoByPrice - 1) * 100, 5);

    if (pctProfitSellBBuyA < pctGAPSellBBuyA) {

        //Log(pctProfitSellBBuyA, '% is not enough for arbitrage...');
        return false;
    }

    if (currStocksB < amountToHedge) {
        Log(nameOfMktB, ':', 'Not enough stock to trade. Skip...');
        return false;
    }

    if (currBalanceA < _N(potentialOutgoByPrice * amountToHedge)) {
        Log(nameOfMktA, ':', 'Not enough money to trade. Skip...');
        return false;
    }

    if (depthBuyAmountB < amountToHedge || depthSellAmountA < amountToHedge) {
        Log('Not enough depth amount to trade.', nameOfMktB, '[', depthBuyAmountB, ']', nameOfMktA, '[', depthSellAmountA, ']', 'Skip...');
        return false;
    }

    return true;
}

function fnTradeForSellBBuyA() {

    addUpTime = 0;
    while (null == exchanges[1].Sell(depthBuyPriceB, amountToHedge)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

        Sleep(delayAfterTrade);
        addUpTime += delayAfterTrade;
    }

    addUpTime = 0;
    while (null == exchanges[0].Buy(depthSellPriceA, amountToHedge)) {

        if (20000 <= addUpTime) {
            Log('Return for next round after retrying for more than 20 seconds');
            return;
        }

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
                depthBuyPriceB * amountToHedge * (1 - feeOfMktB)) / (
                currStocksB - amountToHedge), 5);

    // Cost A after buying
    currCostA = _N((currCostA * currStocksA +
                depthSellPriceA * amountToHedge) / (currStocksA +
                    amountToHedge * (1 - feeOfMktA)), 5);

    Log(nameOfMktB, ': Current cost after selling is', currCostB, '#FF0000');
    Log(nameOfMktA, ': Current cost after buying is', currCostA, '#FF0000');
    Log('Finished selling from', nameOfMktB, 'at', depthBuyPriceB, 'and buying from', nameOfMktA, 'at', depthSellPriceA);
}

function fnTableOutput() {

    assetTable = {type: 'table',
        title: 'Asset Status',
        cols: ['Tries', 'Market', 'Init Bal', 'Init Stock', 'Init Cost', 'Curr Bal', 'Curr Stock', 'Curr Cost', 'Bal Profit %', 'Total Profit %'],
        rows: [
            [numOfTry, nameOfMktA, initBalanceA, initStocksA, initCostA, currBalanceA, currStocksA, currCostA, _N((currBalanceA / initBalanceA - 1) * 100), _N((currAssetA / initAssetA - 1) * 100)],
            [numOfTry, nameOfMktB, initBalanceB, initStocksB, initCostB, currBalanceB, currStocksB, currCostB, _N((currBalanceB / initBalanceB - 1) * 100), _N((currAssetB / initAssetB - 1) * 100)],
            ['Initial Asset:', initTotalAsset, ' ', 'at', beginTime],
            ['Current Asset:', currTotalAsset, ' ', 'at', nowTime],
            ['Total Growth:', _N((currTotalAsset / initTotalAsset - 1) * 100, 4), '%'],
            ['Bithumb', '0.00075', 'coupon', 'period:', '2018-01-28 12:56', '~', '2018-02-27 12:56'],
            ['Cost ADJ After:', realCntForCostADJ, 'Loops']
        ]
    };

    profitTable = {type: 'table',
        title: 'Price Status',
        cols: ['Tries', 'Sell From', 'At Price', 'Max Amount',  'Buy From', 'At Price', 'Max Amount',  'Profit %', 'Target Profit %', 'Result'],
        rows: [
            [numOfTry, nameOfMktA, depthBuyPriceA, depthBuyAmountA, nameOfMktB, depthSellPriceB, depthSellAmountB, pctProfitSellABuyB, pctGAPSellABuyB, pctProfitSellABuyB > pctGAPSellABuyB ? 'Enough' : 'Not Enough'],
            [numOfTry, nameOfMktB, depthBuyPriceB, depthBuyAmountB, nameOfMktA, depthSellPriceA, depthSellAmountA, pctProfitSellBBuyA, pctGAPSellBBuyA, pctProfitSellBBuyA > pctGAPSellBBuyA ? 'Enough' : 'Not Enough']
        ]
    };

    LogStatus('`' + JSON.stringify([assetTable, flagTable, profitTable, initTable]) + '`');
}

function fnAdjustCostPosition() {

    // For Market A
    if (_N(currCostA * currStocksA + currBalanceA) < maxInvest) {

        // Money and coin is less than maximum invest
        actualInvestA = _N(currCostA * currStocksA + currBalanceA);

    } else if (_N(currCostA * currStocksA + currBalanceA) >= maxInvest) {

        // Money and coin is equal or more than maximum invest
        actualInvestA = maxInvest;
    }

    currPositionA = _N(currCostA * currStocksA / actualInvestA);

    if (currPositionA >= thLongPosition) {

        // Coin is more than threshold of long position
        Log(nameOfMktA, 'in long position, decrease current cost by', gapToCP * 100, '%', '#FF0000');
        currCostA = currCostA * (1 - gapToCP);

        flagShortTradeA = 1;
        flagLongTradeA = 0;

        realCntForCostADJ = cntForCostADJ;

    } else if (currPositionA <= thShortPosition) {

        // Coin is less than threshold of short position
        Log(nameOfMktA, 'in short position, increase current cost by', gapToCP * 100, '%', '#FF0000');
        currCostA = currCostA * (1 + gapToCP);

        flagShortTradeA = 0;
        flagLongTradeA = 1;

        realCntForCostADJ = cntForCostADJ;
    }

    // For Market B
    if (_N(currCostB * currStocksB + currBalanceB) < maxInvest) {

        // Money and coin is less than maximum invest
        actualInvestB = _N(currCostB * currStocksB + currBalanceB);

    } else if (_N(currCostB * currStocksB + currBalanceB) >= maxInvest) {

        // Money and coin is equal or more than maximum invest
        actualInvestB = maxInvest;
    }

    currPositionB = _N(currCostB * currStocksB / actualInvestA);

    if (currPositionB >= thLongPosition) {

        // Coin is more than threshold of long position
        Log(nameOfMktB, 'in long position, decrease current cost by', gapToCP * 100, '%', '#FF0000');
        currCostB = currCostB * (1 - gapToCP);

        flagShortTradeB = 1;
        flagLongTradeB = 0;

        realCntForCostADJ = cntForCostADJ;

    } else if (currPositionB <= thShortPosition) {

        // Coin is less than threshold of short position
        Log(nameOfMktB, 'in short position, increase current cost by', gapToCP * 100, '%', '#FF0000');
        currCostB = currCostB * (1 + gapToCP);

        flagShortTradeB = 0;
        flagLongTradeB = 1;

        realCntForCostADJ = cntForCostADJ;
    }
}

function onTick() {

    flagLogProfit = 0;

    nowTime = new Date().getTime();
    nowTime = _D(nowTime, fmt='yyyy-MM-dd hh:mm:ss');

    pctProfitSellABuyB = 0;
    pctProfitSellBBuyA = 0;

    // Get depth price
    fnGetDepthForMkts();

    // Get current account information for close position
    fnGetCurrInfoFromMkt();

    // Check position flags for close position
    fnPositionFlagCheck();

    // Close position
    fnPerformClosePosition();

    // Get current account information again for hedge trade
    fnGetCurrInfoFromMkt();

    // Check directional flags again for hedge trade
    fnPositionFlagCheck();

    if (true == fnCompForSellABuyB()) {

        fnTradeForSellABuyB();
    }

    if (true == fnCompForSellBBuyA()) {

        fnTradeForSellBBuyA();
    }

    // Get current account information for profit logging
    fnGetCurrInfoFromMkt();

    initTotalAsset = initAssetA + initAssetB;
    currAssetA = _N(currBalanceA + currStocksA * depthAvgPriceA);
    currAssetB = _N(currBalanceB + currStocksB * depthAvgPriceB);
    currTotalAsset = currAssetA + currAssetB;;

    fnTableOutput();

    if (1 == flagLogProfit) {
        //LogProfit(_N(currBalanceA + currBalanceB - initBalanceA - initBalanceB));
        LogProfit(_N(currTotalAsset - initTotalAsset));
        Log('Total Asset change from', initTotalAsset, 'at', beginTime, 'to', currTotalAsset, 'at', nowTime, '. Total Growth:', _N((currTotalAsset / initTotalAsset - 1) * 100, 4), '%@');
    }

    // Cost position ajustment
    if (realCntForCostADJ <= 0) {
        fnAdjustCostPosition();
    }
}

function main() {
    if (resetData) {
        LogProfitReset();
        LogReset();
    }

    Log('Welcome to Graystone Corp.', '#FF0000');
    Log('This version support one coin and two markets within BCH|BTC|ETC|ETH|LTC and OKCoin_EN|Bitfinex|Coinone|Bithumb.', '#FF0000');
    Log('Cylon Zoe ver 0.5 is booting up in 3...2...1... It is time to improve close position algorithm...', '#FF0000@');
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
            ['Reset data after start', 'bool', resetData],
            ['Maximum tries', 'number', 0 == maxOfTry ? 'Infinite' : maxOfTry],
            ['Count for cost adjustment', 'number', cntForCostADJ],
            ['GAP to hedge', 'number', gapToHedge],
            ['Amount to hedge', 'number', amountToHedge],
            ['GAP to close position', 'number', gapToCP],
            ['Amount to close position', 'number', amountToCP],
            ['Maxinum invest', 'number', maxInvest],
            ['Threshold of long position', 'number', thLongPosition],
            ['Threshold to short trade', 'number', thShortTrade],
            ['Threshold to long trade', 'number', thLongTrade],
            ['Threshold of short position', 'number', thShortPosition]
        ]
    };

    realCntForCostADJ = cntForCostADJ;

    // Main loop
    while (true) {
        //Log('Main Loop, try', numOfTry);
        onTick();

        if (numOfTry >= maxOfTry && 0 != maxOfTry || 1 == flagExit) {
            return;
        }

        numOfTry++;
        realCntForCostADJ--;
        Sleep(delayOfMainLoop);
    }
}
