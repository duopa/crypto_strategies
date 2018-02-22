
// Version 0.6

// Constants
var bResetData = false;
var nZERO = 0;
var nUP = 1;
var nDOWN = 2;
var nDirection = nZERO;

// Global Variables
var tsBeginTime = 0;
var sBeginTime = null;
var tsNowTime = 0;
var sNowTime = null;
var nMinTradeAmount = 1;
var nMaxTradeAmount = 10;
var nHedgeTradeDiff = 0.001;
var nNormalDelay = 500;
var nMaximumDelay = 60000;
var bCPEnabled = true;
var nCPAmountDiff = 5;      // N times of nMaxTradeAmount
var nCPValueDiff = 50000;   // Value difference
var bFilterNormalErrors = false;
var bCancelPendingOrders = false;
var nCurrAvgPrice = 0;
var nLastAvgPrice = 0;

// Market A
var oInitAccountA = null;
var oCurrAccountA = null;
var sMktNameA = null;
var sStockTypeA = null;
var nTradeFeeA = 0;
var nDepthSellPriceA = 0;
var nDepthSellAmountA = 0;
var nDepthBuyPriceA = 0;
var nDepthBuyAmountA = 0;

// Market B
var oInitAccountB = null;
var oCurrAccountB = null;
var sMktNameB = null;
var sStockTypeB = null;
var nTradeFeeB = 0;
var nDepthSellPriceB = 0;
var nDepthSellAmountB = 0;
var nDepthBuyPriceB = 0;
var nDepthBuyAmountB = 0;


/* Input Parameters
   Name                  Description                       Type     Default Value
   nBalanceDot          Precision of balance              number   2
   nStockDot            Precision of stock                number   5
   nNormalDelay       Delay of main loop                number   500
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
var nTradeFeeA = 0;

var sMktNameA;
var sStockTypeA;
var sBalanceTypeA;

var depthAvgPriceA;
var depthSellPriceA;
var depthSellAmountA;
var depthBuyPriceA;
var depthBuyAmountA;

var oInitAccountA;
var initBalanceA;
var initStocksA;

var oCurrAccountA;
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
var nTradeFeeB = 0;

var sMktNameB;
var sStockTypeB;
var sBalanceTypeB;

var depthAvgPriceB;
var depthSellPriceB;
var depthSellAmountB;
var depthBuyPriceB;
var depthBuyAmountB;

var oInitAccountB;
var initBalanceB;
var initStocksB;

var oCurrAccountB;
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
var sNowTime;
var addUpTime;

var initTotalAsset;
var currTotalAsset;

function onexit() {
    Log('Cylon Zoe shut down, see you next time...', '#FF0000');
}

function fnGetInitAcctInfo() {

    // Get Initial Account Information A
    oInitAccountA = _C(exchanges[0].GetAccount);
    sMktNameA = _C(exchanges[0].GetName);
    sStockTypeA = _C(exchanges[0].GetCurrency);
    sBalanceTypeA = _C(exchanges[0].GetQuoteCurrency);
Log('sMktNameA', sMktNameA, 'sStockTypeA', sStockTypeA, 'sBalanceTypeA', sBalanceTypeA);
Log('Amount', oInitAccountA.Stocks);
    // Get Initial Account Information  B
    oInitAccountB = _C(exchanges[1].GetAccount);
    sMktNameB = _C(exchanges[1].GetName);
    sStockTypeB = _C(exchanges[1].GetCurrency);
    sBalanceTypeB = _C(exchanges[1].GetQuoteCurrency);
}

function fnTradingFeeAssignment() {

    // Trading fee assignment for market A
    switch (sMktNameA) {

        case 'OKCoin_EN':
        case 'Bitfinex':
            nTradeFeeA = 0.002;
        case 'Coinone':
            nTradeFeeA = 0.001;
        case 'Bithumb':
            nTradeFeeA = 0.00075;
        default:
            nTradeFeeA = 0.002;
    }

    // Trading fee assignment for market B
    switch (sMktNameA) {

        case 'OKCoin_EN':
        case 'Bitfinex':
            nTradeFeeB = 0.002;
        case 'Coinone':
            nTradeFeeB = 0.001;
        case 'Bithumb':
            nTradeFeeB = 0.00075;
        default:
            nTradeFeeB = 0.002;
    }
}

function fnInitialization() {

    Log('======== Initialization Begin ========', '#FF0000');
    fnGetInitAcctInfo();

    // Check type of stock and balance matching
    if (sStockTypeA != sStockTypeB) {

        throw 'Stock type of' + sMktNameA + '[' + sStockTypeA + '] and' + sMktNameB + '[' + sStockTypeB + '] do not match, pause...';

    } else if (sBalanceTypeA != sBalanceTypeB) {

        throw 'Balance type of' + sMktNameA + '[' + sBalanceTypeA + '] and' + sMktNameB + '[' + sBalanceTypeB + '] do not match, pause...';
    }

    // Check type of balance for market A
    if ('OKCoin_EN' == sMktNameA || 'Bitfinex' == sMktNameA) {

        if ('USD' != sBalanceTypeA) {

            throw 'Balance type of' + sMktNameA + '[' + sBalanceTypeA + '] should be USD, pause...';
        }

    } else if ('Coinone' == sMktNameA || 'Bithumb' == sMktNameA) {

        if ('KRW' != sBalanceTypeA) {

            throw 'Balance type of' + sMktNameA + '[' + sBalanceTypeA + '] should be KRW, pause...';
        }
    }

    // Check type of balance for market B
    if ('OKCoin_EN' == sMktNameB || 'Bitfinex' == sMktNameB) {

        if ('USD' != sBalanceTypeB) {

            throw 'Balance type of' + sMktNameB + '[' + sBalanceTypeB + '] should be USD, pause...';
        }

    } else if ('Coinone' == sMktNameB || 'Bithumb' == sMktNameB) {

        if ('KRW' != sBalanceTypeB) {

            throw 'Balance type of' + sMktNameB + '[' + sBalanceTypeB + '] should be KRW, pause...';
        }
    }

    fnTradingFeeAssignment();

    Log('Market A:', sMktNameA, oInitAccountA, 'Trade Fee', nTradeFeeA);
    Log('Market B:', sMktNameB, oInitAccountB, 'Trade Fee', nTradeFeeB);

    Log('======== Initialization Finish ========', '#FF0000');
}

function fnGetMktDepth() {

    // Market Depth A
    var oDepthA = _C(exchanges[0].GetDepth);

    nDepthSellPriceA = oDepthA.Asks[0].Price;
    nDepthSellAmountA = oDepthA.Asks[0].Amount;

    nDepthBuyPriceA = oDepthA.Bids[0].Price;
    nDepthBuyAmountA = nDepthBuyAmountA;

    nDepthAvgPriceA = (nDepthSellPriceA + nDepthBuyPriceA) / 2;

    // Market Depth B
    var oDepthB = _C(exchanges[1].GetDepth);

    nDepthSellPriceB = oDepthB.Asks[0].Price;
    nDepthSellAmountB = nDepthSellAmountB;

    nDepthBuyPriceB = oDepthB.Bids[0].Price;
    nDepthBuyAmountB = nDepthBuyAmountB;

    nDepthAvgPriceB = (nDepthSellPriceB + nDepthBuyPriceB) / 2;
}

function fnGetCurrAcctInfo() {

    // Get current informations from market A
    oCurrAccountA = _C(exchanges[0].GetAccount);

    // Get current informations from market B
    oCurrAccountB = _C(exchanges[1].GetAccount);
}

function fnClosePosition() {

    var nStockDiff = (oCurrAccountA.Stocks + oCurrAccountB.Stocks) - (oInitAccountA.Stocks + oInitAccountB.Stocks);

    if (Math.abs(nStockDiff) / nMaxTradeAmount >= nCPAmountDiff && Math.abs(nStockDiff) * nCurrAvgPrice >= nCPValueDiff) {

        Log('Close Position Needed. The amount difference between Current Stocks', oCurrAccountA.Stocks + oCurrAccountB.Stocks, 
                'and Initial Stocks', oInitAccountA.Stocks + oInitAccountB.Stocks, 'is', nStockDiff, 
                'which is more than', nCPAmountDiff, 'times of Maximum Trade Amount', nMaxTradeAmount,
                'and the value difference is more than', nCPValueDiff, 'Perform Close Position after 1 minutes', '#FF0000');

        Sleep(60000);

    } else {
        return;
    }

    var sOrderId = null;
    var oOrders = null;
    var idxOrders = 0;

    if (nStockDiff > 0) {

        if (oCurrAccountA.Stocks >= oCurrAccountB.Stocks) {

            if (oCurrAccountA.Stocks >= nStockDiff) {

                Log('Sell stocks at', sMktNameA);

                for (; nStockDiff >= nMinTradeAmount;) {
                    
                    fnGetMktDepth();
                    sOrderId = exchanges[0].Sell(nDepthBuyPriceA, Math.floor(nStockDiff));

                    if (null == sOrderId) {
                    
                        Sleep(nNormalDelay);
                        continue;

                    } else {

                        oOrders = _C(exchanges[0].GetOrders);
                        Log(oOrders);
                        
                        for (idxOrders = 0; idxOrders < oOrders.length; idxOrders++) {

                            if (sOrderId == oOrders[idxOrders].Id) {
                                
                                _C(exchanges[0].CancelOrder(sOrderId));
                                Log(oOrders[idxOrders].Amount - oOrders[idxOrders].Amount.DealAmount, 'left');
                                break;
                            }
                        }

                        nStockDiff -= oOrders[idxOrders].Amount.DealAmount;
                        Sleep(nNormalDelay);
                        continue;
                    }
                }

                Log('Close Position Complete, return...');
                return;

            } else if (oCurrAccountA.Stocks >= nStockDiff / 2 && oCurrAccountB.Stocks >= nStockDiff / 2) {

                throw 'Both stocks from A and B are more than half nStockDiff, pause...';

            } else {

                throw 'Both stocks from A and B are less than half nStockDiff, pause...';
            }

        } else if (oCurrAccountA.Stocks < oCurrAccountB.Stocks) {

            if (oCurrAccountB.Stocks >= nStockDiff) {

                Log('Sell stocks at', sMktNameB);

                for (; nStockDiff >= nMinTradeAmount;) {
                    
                    fnGetMktDepth();
                    sOrderId = exchanges[1].Sell(nDepthBuyPriceB, Math.floor(nStockDiff));

                    if (null == sOrderId) {
                    
                        Sleep(nNormalDelay);
                        continue;

                    } else {

                        oOrders = _C(exchanges[1].GetOrders);
                        Log(oOrders);
                        
                        for (idxOrders = 0; idxOrders < oOrders.length; idxOrders++) {

                            if (sOrderId == oOrders[idxOrders].Id) {
                                
                                _C(exchanges[1].CancelOrder(sOrderId));
                                Log(oOrders[idxOrders].Amount - oOrders[idxOrders].Amount.DealAmount, 'left');
                                break;
                            }
                        }

                        nStockDiff -= oOrders[idxOrders].Amount.DealAmount;
                        Sleep(nNormalDelay);
                        continue;
                    }
                }

                Log('Close Position Complete, return...');
                return;

            } else if (oCurrAccountA.Stocks >= nStockDiff / 2 && oCurrAccountB.Stocks >= nStockDiff / 2) {

                throw 'Both stocks from A and B are more than half nStockDiff, pause...';

            } else {

                throw 'Both stocks from A and B are less than half nStockDiff, pause...';
            }
        }

    } else if (nStockDiff < 0) {
    
        throw 'nStockDiff is smaller than 0, pause...';
    }
}

function fnHedgeTradeSellABuyB() {

    if (nDepthBuyPriceA <= nDepthSellPriceB) {
        return false;
    }

    var nIncomeByPrice = 0;
    var nOutgoByPrice = 0;

    nIncomeByPrice = nDepthBuyPriceA * (1 - nTradeFeeA);
    nOutgoByPrice = nDepthSellPriceB * (1 + nTradeFeeB);

    if (nIncomeByPrice <= nOutgoByPrice) {

        Log('Income less than Outgo...');
        return false;
    }

    if (nIncomeByPrice / nOutgoByPrice - 1 < nHedgeTradeDiff) {

        Log('Difference less than Hedge Trade Diff');
        return false;
    }

    if (nDepthBuyAmountA < nMinTradeAmount) {
    
        Log('Amount less than Minimum Trade Amount');
        return false;
    }

    var nTradeAmount = nDepthBuyAmountA <= nDepthSellAmountB ? nDepthBuyAmountA : nDepthSellAmountB;
    nTradeAmount = nTradeAmount <= nMaxTradeAmount ? nTradeAmount : nMaxTradeAmount;

    var sOrderIdA = null;
    var sOrderIdB = null;

    // Sell A first then Buy B
    if (nDirection == nDOWN) {
    
        sOrderIdA = exchanges[0].Sell(nDepthBuyPriceA, nTradeAmount);
        sOrderIdB = exchanges[1].Buy(nDepthSellPriceB, nTradeAmount);

        return true; 
    }

    // Buy B first then Sell A
    if (nDirection == nUP) {
   
        sOrderId = exchanges[1]
        return true;
    }

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
            [numOfTry, sMktNameA, actualInvestA, currBalanceA, currStocksA, currPositionA * 100, flagLongTradeA, flagShortTradeA, countForSellA, countForBuyA],
            [numOfTry, sMktNameB, actualInvestB, currBalanceB, currStocksB, currPositionB * 100, flagLongTradeB, flagShortTradeB, countForSellB, countForBuyB]
        ]
    };
}

function fnPerformClosePosition() {

    // For Market A
    gapCPSellA = gapToCP * (1 + countForSellA);
    gapCPBuyA = gapToCP * (1 + countForBuyA);

    if (1 != flagLongTradeA && currCostA < _N(depthBuyPriceA * (1 - nTradeFeeA) * (1 - gapCPSellA), 5)) {

        // Sell A
        Log(sMktNameA, ': Close position needed. Current cost before selling is', currCostA, '#FF0000');

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
                Log('Close position by selling from', sMktNameA, 'at', depthBuyPriceA, 'GAP is ', gapCPSellA);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForSellA++;
                countForBuyA = 0;

                // Cost A after selling
                currCostA = _N((currCostA * currStocksA -
                            depthBuyPriceA * amountToCP * (1 - nTradeFeeA)) / (
                            currStocksA - amountToCP), 5);

                Log(sMktNameA, ': Close position finished. Current cost after selling is', currCostA, '#FF0000');

            } else {
                Log(sMktNameA, ': Close position canceled.');
            }
        }

    } else if (1 != flagShortTradeA && currCostA > _N(depthSellPriceA * (1 + nTradeFeeA) * (1 + gapCPBuyA), 5)) {

        // Buy A
        Log(sMktNameA, ': Close position needed. Current cost before buying is', currCostA, '#FF0000');

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
                Log('Close position by buying from', sMktNameA, 'at', depthSellPriceA, 'GAP is ', gapCPBuyA);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForBuyA++;
                countForSellA = 0;

                // Cost A after buying
                currCostA = _N((currCostA * currStocksA +
                            depthSellPriceA * amountToCP) / (currStocksA +
                                amountToCP * (1 - nTradeFeeA)), 5);

                Log(sMktNameA, ': Close position finished. Current cost after buying is', currCostA, '#FF0000');

            } else {
                Log(sMktNameA, ': Close position canceled.');
            }
        }
    }

    // For Market B
    gapCPSellB = gapToCP * (1 + countForSellB);
    gapCPBuyB = gapToCP * (1 + countForBuyB);


    if (1 != flagLongTradeB && currCostB < _N(depthBuyPriceB * (1 - nTradeFeeB) * (1 - gapCPSellB), 5)) {

        // Sell B
        Log(sMktNameB, ': Close position needed. Current cost before selling is', currCostB, '#FF0000');

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
                Log('Close position by selling from', sMktNameB, 'at', depthBuyPriceB, 'GAP is ', gapCPSellB);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForSellB++;
                countForBuyB = 0;

                // Cost B after selling
                currCostB = _N((currCostB * currStocksB -
                            depthBuyPriceB * amountToCP * (1 - nTradeFeeB)) / (
                            currStocksB - amountToCP), 5);

                Log(sMktNameB, ': Close position finished. Current cost after selling is', currCostB, '#FF0000');

            } else {
                Log(sMktNameB, ': Close position canceled.');
            }
        }

    } else if (1 != flagShortTradeB && currCostB > _N(depthSellPriceB * (1 + nTradeFeeB) * (1 + gapCPBuyB), 5)) {

        // Buy B
        Log(sMktNameB, ': Close position needed. Current cost before buying is', currCostB, '#FF0000');

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
                Log('Close position by buying from', sMktNameB, 'at', depthSellPriceB, 'GAP is ', gapCPBuyB);
                Sleep(delayAfterTrade);
                flagLogProfit = 1;
                countForBuyB++;
                countForSellB = 0;

                // Cost B after buying
                currCostB = _N((currCostB * currStocksB +
                            depthSellPriceB * amountToCP) / (currStocksB +
                                amountToCP * (1 - nTradeFeeB)), 5);

                Log(sMktNameB, ': Close position finished. Current cost after buying is', currCostB, '#FF0000');

            } else {
                Log(sMktNameB, ': Close position canceled.');
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

    potentialIncomeByPrice = _N(depthBuyPriceA * (1 - nTradeFeeA), 5);
    potentialOutgoByPrice = _N(depthSellPriceB * (1 + nTradeFeeB), 5);

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
        Log(sMktNameA, ':', 'Not enough stock to trade. Skip...');
        return false;
    }

    if (currBalanceB < _N(potentialOutgoByPrice * amountToHedge)) {
        Log(sMktNameB, ':', 'Not enough money to trade. Skip...');
        return false;
    }

    if (depthBuyAmountA < amountToHedge || depthSellAmountB < amountToHedge) {
        Log('Not enough depth amount to trade.', sMktNameA, '[', depthBuyAmountA, ']', sMktNameB, '[', depthSellAmountB, ']', 'Skip...');
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

    Log(sMktNameA, ': Current cost before selling is', currCostA, '#FF0000');
    Log(sMktNameB, ': Current cost before buying is', currCostB, '#FF0000');

    // Cost A after selling
    currCostA = _N((currCostA * currStocksA -
                depthBuyPriceA * amountToHedge * (1 - nTradeFeeA)) / (
                currStocksA - amountToHedge), 5);

    // Cost B after buying
    currCostB = _N((currCostB * currStocksB +
                depthSellPriceB * amountToHedge) / (currStocksB +
                    amountToHedge * (1 - nTradeFeeB)), 5);

    Log(sMktNameA, ': Current cost after selling is', currCostA, '#FF0000');
    Log(sMktNameB, ': Current cost after buying is', currCostB, '#FF0000');
    Log('Finished selling from', sMktNameA, 'at', depthBuyPriceA, 'and buying from', sMktNameB, 'at', depthSellPriceB);
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

    potentialIncomeByPrice = _N(depthBuyPriceB * (1 - nTradeFeeB), 5);
    potentialOutgoByPrice = _N(depthSellPriceA * (1 + nTradeFeeA), 5);

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
        Log(sMktNameB, ':', 'Not enough stock to trade. Skip...');
        return false;
    }

    if (currBalanceA < _N(potentialOutgoByPrice * amountToHedge)) {
        Log(sMktNameA, ':', 'Not enough money to trade. Skip...');
        return false;
    }

    if (depthBuyAmountB < amountToHedge || depthSellAmountA < amountToHedge) {
        Log('Not enough depth amount to trade.', sMktNameB, '[', depthBuyAmountB, ']', sMktNameA, '[', depthSellAmountA, ']', 'Skip...');
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

    Log(sMktNameB, ': Current cost before selling is', currCostB, '#FF0000');
    Log(sMktNameA, ': Current cost before buying is', currCostA, '#FF0000');

    // Cost B after selling
    currCostB = _N((currCostB * currStocksB -
                depthBuyPriceB * amountToHedge * (1 - nTradeFeeB)) / (
                currStocksB - amountToHedge), 5);

    // Cost A after buying
    currCostA = _N((currCostA * currStocksA +
                depthSellPriceA * amountToHedge) / (currStocksA +
                    amountToHedge * (1 - nTradeFeeA)), 5);

    Log(sMktNameB, ': Current cost after selling is', currCostB, '#FF0000');
    Log(sMktNameA, ': Current cost after buying is', currCostA, '#FF0000');
    Log('Finished selling from', sMktNameB, 'at', depthBuyPriceB, 'and buying from', sMktNameA, 'at', depthSellPriceA);
}

function fnTableOutput() {

    assetTable = {type: 'table',
        title: 'Asset Status',
        cols: ['Tries', 'Market', 'Init Bal', 'Init Stock', 'Init Cost', 'Curr Bal', 'Curr Stock', 'Curr Cost', 'Bal Profit %', 'Total Profit %'],
        rows: [
            [numOfTry, sMktNameA, initBalanceA, initStocksA, initCostA, currBalanceA, currStocksA, currCostA, _N((currBalanceA / initBalanceA - 1) * 100), _N((currAssetA / initAssetA - 1) * 100)],
            [numOfTry, sMktNameB, initBalanceB, initStocksB, initCostB, currBalanceB, currStocksB, currCostB, _N((currBalanceB / initBalanceB - 1) * 100), _N((currAssetB / initAssetB - 1) * 100)],
            ['Initial Asset:', initTotalAsset, ' ', 'at', beginTime],
            ['Current Asset:', currTotalAsset, ' ', 'at', sNowTime],
            ['Total Growth:', _N((currTotalAsset / initTotalAsset - 1) * 100, 4), '%'],
            ['Bithumb', '0.00075', 'coupon', 'period:', '2018-01-28 12:56', '~', '2018-02-27 12:56'],
            ['Cost ADJ After:', realCntForCostADJ, 'Loops']
        ]
    };

    profitTable = {type: 'table',
        title: 'Price Status',
        cols: ['Tries', 'Sell From', 'At Price', 'Max Amount',  'Buy From', 'At Price', 'Max Amount',  'Profit %', 'Target Profit %', 'Result'],
        rows: [
            [numOfTry, sMktNameA, depthBuyPriceA, depthBuyAmountA, sMktNameB, depthSellPriceB, depthSellAmountB, pctProfitSellABuyB, pctGAPSellABuyB, pctProfitSellABuyB > pctGAPSellABuyB ? 'Enough' : 'Not Enough'],
            [numOfTry, sMktNameB, depthBuyPriceB, depthBuyAmountB, sMktNameA, depthSellPriceA, depthSellAmountA, pctProfitSellBBuyA, pctGAPSellBBuyA, pctProfitSellBBuyA > pctGAPSellBBuyA ? 'Enough' : 'Not Enough']
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
        Log(sMktNameA, 'in long position, decrease current cost by', gapToCP * 100, '%', '#FF0000');
        currCostA = currCostA * (1 - gapToCP);

        flagShortTradeA = 1;
        flagLongTradeA = 0;

        realCntForCostADJ = cntForCostADJ;

    } else if (currPositionA <= thShortPosition) {

        // Coin is less than threshold of short position
        Log(sMktNameA, 'in short position, increase current cost by', gapToCP * 100, '%', '#FF0000');
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
        Log(sMktNameB, 'in long position, decrease current cost by', gapToCP * 100, '%', '#FF0000');
        currCostB = currCostB * (1 - gapToCP);

        flagShortTradeB = 1;
        flagLongTradeB = 0;

        realCntForCostADJ = cntForCostADJ;

    } else if (currPositionB <= thShortPosition) {

        // Coin is less than threshold of short position
        Log(sMktNameB, 'in short position, increase current cost by', gapToCP * 100, '%', '#FF0000');
        currCostB = currCostB * (1 + gapToCP);

        flagShortTradeB = 0;
        flagLongTradeB = 1;

        realCntForCostADJ = cntForCostADJ;
    }
}

function onTick() {

    // Check directional flags again for hedge trade
    fnPositionFlagCheck();

    if (true == fnCompForSellABuyB()) {

        fnTradeForSellABuyB();
    }

    if (true == fnCompForSellBBuyA()) {

        fnTradeForSellBBuyA();
    }

    // Get current account information for profit logging
    fnGetCurrAcctInfo();

    initTotalAsset = initAssetA + initAssetB;
    currAssetA = _N(currBalanceA + currStocksA * depthAvgPriceA);
    currAssetB = _N(currBalanceB + currStocksB * depthAvgPriceB);
    currTotalAsset = currAssetA + currAssetB;;

    fnTableOutput();

    if (1 == flagLogProfit) {
        //LogProfit(_N(currBalanceA + currBalanceB - initBalanceA - initBalanceB));
        LogProfit(_N(currTotalAsset - initTotalAsset));
        Log('Total Asset change from', initTotalAsset, 'at', beginTime, 'to', currTotalAsset, 'at', sNowTime, '. Total Growth:', _N((currTotalAsset / initTotalAsset - 1) * 100, 4), '%@');
    }

    // Cost position ajustment
    if (realCntForCostADJ <= 0) {
        fnAdjustCostPosition();
    }
}

function main() {
    if (bResetData) {
        LogProfitReset();
        LogReset();
    }

    Log('Welcome to Graystone Corp.');
    Log('After one week research from other stategies, it is time to have a fresh new start. So, Ripple, here I come...');
    Log('Cylon Zoe ver 0.6 is booting up for Sheep Shearing in 3...2...1...', '#FF0000');
    Sleep(3000);

    tsBeginTime = new Date().getTime();
    sBeginTime = _D(tsBeginTime, fmt='yyyy-MM-dd hh:mm:ss');

    var testAccount1 = exchanges[0].IO('api', 'POST', '/v2/account/balance/');
    Log('krw', testAccount1.krw.balance, 'xrp', testAccount1.xrp.balance);
    var testAccount2 = exchanges[1].IO('api', 'POST', '/info/balance', 'currency=xrp');
    Log('krw', testAccount2.data.total_krw, 'xrp', testAccount2.data.total_xrp);
    //Log(testAccount2);
    //var testAccount2 = exchanges[1].IO('api', 'POST', '/public/ticker/XRP');
    //var testAccount2 = exchanges[1].IO('api', 'POST', '/info/account', 'xrp');
    //var testAccount2 = exchanges[1].IO('api', 'POST', '/public/orderbook/xrp');
    //Log(testAccount2.data.asks[0]);
    //Log(testAccount2.data.bids[0]);
    throw 'testing here';

    // Initialization
    if (false == fnInitialization()) {
        throw 'Initialization failed, pause...';
    } else {
        
        Log('Stock Type [', sStockTypeA, '] Initial Amount [', oInitAccountA.Stocks + oInitAccountB.Stocks, ']');     // sStockTypeA == sStockTypeB
        Log('Market A [', sMktNameA, '] Initial Balance [', oInitAccountA.Balance, ']');
        Log('Market B [', sMktNameB, '] Initial Balance [', oInitAccountA.Balance, ']');
    }

    Log('======== Parameter Checking ========', '#FF0000');

    Log('Minimum Trade Amount [', nMinTradeAmount, '] Maximum Trade Amount [', nMaxTradeAmount, ']');
    Log('Normal Delay [', nNormalDelay, 'ms', '] MaximumDelay [', nMaximumDelay, 'ms ]');
    Log('Close Position [', bCPEnabled, ']');
    Log('CP when Stock is more than Initial Amount for [', nCPAmountDiff, '] times of Maximum Trade Amount and [', nCPValueDiff, '] of value difference');
    Log('Hedge Trade Difference [', nHedgeTradeDiff, ']');
    Log('Filtering normal errors [', bFilterNormalErrors, ']');
    Log('Cancel pending orders [', bCancelPendingOrders, ']');

    Log('Main fuction will start in 30 seconds');
    Sleep(10000);
    Log('Main fuction will start in 20 seconds');
    Sleep(10000);
    Log('Main fuction will start in 10 seconds');
    Sleep(10000);

    Log('======== Main Function Start ========', '#FF0000');

    var testPrice = 10000;
    var testAmount = 1;
    //var sOrderId = exchanges[0].Sell('10000', Math.floor(1));
    var sOrderId = exchanges[0].Sell(testPrice, testAmount);
    throw 'sOrderId is ' + sOrderId;

    // SetErrorFilter(); // For later
    // Cancel Pending Orders // For later

    // Main Function Loop
    while (true) {

        tsNowTime = new Date().getTime();
        sNowTime = _D(tsNowTime, fmt='yyyy-MM-dd hh:mm:ss');

        // Get Market Depth
        fnGetMktDepth();

        nCurrAvgPrice = (nDepthSellPriceA + nDepthBuyPriceA + nDepthSellPriceB + nDepthBuyPriceB) / 4;

        // Get Current Account Information 
        fnGetCurrAcctInfo();

        // Close Position
        fnClosePosition();

        Sleep(nNormalDelay);

        // Get Market Depth
        fnGetMktDepth();

        // Get current account information again for hedge trade
        fnGetCurrAcctInfo();

        if (0 == nLastAvgPrice) {

            nDirection = nUP;

        } else if (nCurrAvgPrice >= nLastAvgPrice) {

            nDirection = nUP;

        } else {

            nDirection = nDOWN;
        }

        if (false == fnHedgeTradeSellABuyB()) {

            //fnHedgeTradeSellBBuyA();
        }

        onTick();

        nLastAvgPrice = nCurrAvgPrice;

        Sleep(nNormalDelay);
    }
}
