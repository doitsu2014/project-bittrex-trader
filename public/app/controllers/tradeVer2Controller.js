angular.module('tradeVer2Ctrl', ['tradeVer2Service'])
    .constant('Constants', {
        TypeOfTrade: {
            buy: 1,
            sell: 2,
            doNothing: 3
        }
    })
    .controller('TradeVer2Controller', function ($scope, $timeout, $interval, $location, $q, TradeVer2Service, Constants) {
        // Tool Variables
        function Coin() {
            this.Name;
            this.PercentChange;
            this.High;
            this.Low;
            this.TotalBought = null;
            this.IsBought = null;
            this.BuyTime = null;
            this.TotalSell = null;
            this.Count;
            
            this.Init = function (obj, count) {
                this.Name = obj.MarketName;
                this.PercentChange = CalcPercentChange(obj.PrevDay, obj.Last);
                this.High = obj.High;
                this.Low = obj.Low;
                this.Count = count ? count : 0;
            };


            const CalcPercentChange = (prevDay, last) => {
                return prevDay ? (last - prevDay) / prevDay * 100 : 0;
            };
        };
        $scope.FirstHashCoins;
        $scope.SecondHashCoins;

        $scope.IsStartTool;

        $scope.TimeCheck;
        $scope.TimeCheckCountDown;
        $scope.ProfitPercent;

        $scope.IdealPercent;
        $scope.BuyAmount;
        $scope.TimeDelay;
        $scope.TimeDelayCountDown;

        let Intervals = function () {
            this.ToolAuto;
            this._ClearIntervals = function () {
                clearInterval(this.ToolAuto);
            };
            
            this._SetIntervals = function () {
                // refresh intervals before set
                this._ClearIntervals();
                this.ToolAuto = setInterval(() => {
                    if ($scope.IsStartTool) {
                        try {
                            if($scope.TimeCheckCountDown > 0) {
                                $scope.TimeCheckCountDown -= 1;                                
                                $scope.SecondHashCoinsUpdate();
                            } else {
                                let BuyList = CheckAndBuy();
                                $scope.FirstHashCoinsUpdate();
                                $scope.TimeCheckCountDown = ConTimeToTimeStamp($scope.TimeCheck);
                            }
                        } catch (err) {
                            console.log(`TradeVer2Controller-ToolAuto: ${err}\n`);
                            $scope.TimeCheckCountDown = ConTimeToTimeStamp($scope.TimeCheck);
                        }
                    }
                }, 1000);
            };
        };
        $scope.MyIntervals = new Intervals();
        

        // Services
        const service = TradeVer2Service;
        const CheckAndBuy = function () {
            let f = $scope.FirstHashCoins;
            let s = $scope.SecondHashCoins;
            for (let market in f) {
                let sPer = s[market] ? s[market].PercentChange : -1;
                let fPer = f[market].PercentChange;
                let temp = sPer - fPer;

                // if temp rather than Ideal Percent;
                if(temp >= $scope.IdealPercent) {
                    /** Buy 
                     * Tool need:
                     * +++ Amount Buy
                     * +++ Check Time Before Buy
                     * +++ If Buy 
                     * +++ Buy Amount
                     * +++ Else do nothing
                     * */
                    if(f[market].IsBought) {
                        let curTS = ((new Date()-new Date(f[market].BuyTime))/1000);
                        if(curTS >= $scope.TimeDelayCountDown) {
                            let amount = $scope.BuyAmount;
                            buyLimit(f[market], amount);
                            // sellLimit(f[market].Name, $scope.ProfitPercent);
                        }
                    } else {
                        let amount = $scope.BuyAmount;
                        buyLimit(f[market], amount);
                        // sellLimit(f[market].Name, $scope.ProfitPercent);
                    }
                } else {
                    // Don't buy
                }
            }
            return {result: false, message: "Check fail!"};
        };
        var buyLimit = function(CurCoin, Quantity) {
            service.buyLimit2(CurCoin.Name, Quantity)
                .then(function(data) {
                    try {
                        if(data.data.success) {
                            CurCoin.TotalBought = data.data.totalSuccess;
                            CurCoin.IsBought = true;
                            CurCoin.BuyTime = new Date();
                            CurCoin.TotalSell = 0;
                            sellLimit(CurCoin, $scope.ProfitPercent);
                            return true;
                        }
                    } catch (err) {
                        console.log(`TradeController-BuyLimit: Error (${err})\n`);
                        return false;
                    }
                }).catch(function(err) {
                    console.log(`TradeController-BuyLimit: Error (${err})\n`);
                    return false;
                });
        };

        var sellLimit = function(CurCoin, ProfitPercent) {
            try {
                getBalance(CurCoin.Name)
                    .then((data) => {
                        console.log(data);
                        if(data.balance) {
                            var reqQuantity = data.balance.Available ? data.balance.Available : 0;
                            service.sellLimit2(CurCoin.Name, reqQuantity, ProfitPercent)
                                .then(function(data) {
                                    try {
                                        // Delay buy after you sell and your balance must be not 0
                                        console.log(data);
                                        if(data.data.success) {
                                            CurCoin.TotalSell = data.data.totalSuccess;
                                        }
                                        return true;
                                    } catch (err) {
                                        console.log(`TradeController-SellLimit: Error (${err})\n`);
                                        return false;
                                    }
                                }).catch(function(err) {
                                    console.log(`TradeController-SellLimit: Error (${err})\n`);
                                    return false;
                                });
                        }
                    });
            } catch (ex) {
                console.log(`TradeController-SellLimit: Error (${ex})\n`);
                return false;
            }
        };
        var getBalance = (MarketName) => {
            // get balance for sell method so you need the name of the left side
            var reqCurrency = MarketName ? MarketName.split('-')[1] : "";
            return $q((resolve, reject) => {
                service.getBalance(reqCurrency)
                    .then(data => {
                        resolve(data.data);
                    });
            });
        };

        // Util Functions
        let CalcPercentChange = (prevDay, last) => {
            return prevDay ? (last - prevDay) / prevDay * 100 : 0;
        };
        let sortMarketList = (markets) => {
            try {
                let sortedMarkets = Object.keys(markets).sort((a,b) => {
                    let aPercent = CalcPercentChange(markets[a].PrevDay,markets[a].Last);
                    let bPercent = CalcPercentChange(markets[b].PrevDay,markets[b].Last);
                    return aPercent < bPercent ? 1 : aPercent > bPercent ? -1 : 0;
                }).filter((key, index) => {return index < 20});
    
                let result = [];
                markets.forEach((ele, index) => {
                    if(sortedMarkets.find((ele)=>{return ele == index;})) {
                        result.push(ele);
                    }
                });
                return result;
            } catch (e) {
                console.log('sortMarketList - Error: ', e);
                return [];
            }
            
        };
        let ConTimeToTimeStamp = (basicTime) => {
            try {
                var elements = basicTime.split(":");
                var result = parseInt(elements[0] * 3600) + parseInt(elements[1] * 60) + parseInt(elements[2]);
                return result;
            } catch (err) {
                console.log(`TradeVer2Controller-ConTimeToTimeStamp: ${err}`);
                return 5;
            }
        };

        // Main Functions
        $scope.GetMarkets = function (coinName) {
            let markets = service.getMarkets(coinName);
            return markets;
        };
        $scope.FirstHashCoinsUpdate = async function (count) {
            let markets = await $scope.GetMarkets('BTC');
            let sortedList = sortMarketList(markets);
            if(sortedList.length > 0) {
                if(!$scope.FirstHashCoins) {
                    $scope.FirstHashCoins = {}; 
                    sortedList.forEach((ele, index) => {
                        let coin = new Coin();
                        coin.Init(ele);
                        $scope.FirstHashCoins[coin.Name] = coin;
                    });
                    return {message:"New first hash coins, OK", success: true};
                } else {
                    sortedList.forEach((ele, index) => {
                        let curCoin = $scope.FirstHashCoins[ele.MarketName];
                        if(curCoin) {
                            curCoin.Init(ele, curCoin.Count+1);
                        }
                    });
                    return {message:"Update first hash coins, OK", success: true};
                }
            } else {
                console.log('First Hash Coins Update Error: sortedList is empty');
            }
        };
        $scope.SecondHashCoinsUpdate = async function (count) {
            let markets = await $scope.GetMarkets('BTC');
            let sortedList = sortMarketList(markets);
            if(sortedList.length > 0) {
                if(!$scope.SecondHashCoins) {
                    $scope.SecondHashCoins = {}; 
                    sortedList.forEach((ele, index) => {
                        let coin = new Coin();
                        coin.Init(ele);
                        $scope.SecondHashCoins[coin.Name] = coin;
                    });
                    return {message:"New second hash coins, OK", success: true};
                } else {
                    sortedList.forEach((ele, index) => {
                        let curCoin = $scope.SecondHashCoins[ele.MarketName];
                        if(curCoin) {
                            curCoin.Init(ele, curCoin.Count+1);
                        }
                    });
                    return {message:"Update second hash coins, OK", success: true};
                }
            } else {
                console.log('Second Hash Coins Update Update Error: sortedList is empty');
                
            }
        };
        $scope.stopIntervals = () => {
            $scope.MyIntervals._ClearIntervals();
        };
        $scope.setIntervals = () => {
            $scope.MyIntervals._SetIntervals();
        };
        $scope.StartTool = () => {
            $scope.IsStartTool = true;
            $scope.TimeCheckCountDown = ConTimeToTimeStamp($scope.TimeCheck);
            $scope.TimeDelayCountDown = ConTimeToTimeStamp($scope.TimeDelay);

            $scope.setIntervals();
        };
        $scope.StopTool = () => {
            $scope.IsStartTool = false;
            $scope.TimeCheckCountDown = ConTimeToTimeStamp($scope.TimeCheck);
            $scope.TimeDelayCountDown = ConTimeToTimeStamp($scope.TimeDelay);

            $scope.stopIntervals();
        };
        // First Init Functions
        $scope.FirstHashCoinsUpdate();
        $scope.FirstHashCoinsUpdate();
    });