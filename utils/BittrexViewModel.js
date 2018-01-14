function bittrexVersion() {
    "use strict";
    var n = this,
        t;
    n.version = null;
    n.needsUpdate = !1;
    t = function (t) {
        t.version && (n.version ? t.version != n.version && (n.needsUpdate = !0, $("#refreshModal").modal({
            keyboard: !1,
            show: !0,
            backdrop: "static"
        })) : n.version = t.version)
    };
    $("#event-store").on("data-query-version", t)
}

function marketSummaryEntry(n) {
    var t = this,
        i;
    t.marketName = "";
    t.baseCurrency = "";
    t.marketCurrency = "";
    t.marketCurrencyName = "";
    t.title = "";
    t.keywords = "";
    t.prevDay = ko.observable(0);
    t.last = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.ask = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.bid = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.spread = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.high = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.low = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.baseVolume = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.marketVolume = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.change = ko.observable(0).extend({
        calculateDelta: ""
    });
    t.isFiat = ko.pureComputed(function () {
        return t.baseCurrency == "USD" || t.baseCurrency == "CNY" || t.baseCurrency == "USDT" || t.baseCurrency == "BITCNY"
    });
    t.isActive = ko.observable(!1);
    t.isVerified = ko.observable(!1);
    t.created = ko.observable(new moment);
    t.lastUpdated = ko.observable(new moment);
    t.isEven = ko.observable(!1);
    t.imgPath = "";
    t.urlPath = "";
    t.isSponsored = ko.observable(!1);
    i = function () {
        return t.isFiat() ? 2 : 8
    };
    t.displayLast = ko.pureComputed(function () {
        return t.last().toFixed(i())
    }, this);
    t.displayAsk = ko.pureComputed(function () {
        return t.ask().toFixed(i())
    }, this);
    t.displayBid = ko.pureComputed(function () {
        return t.bid().toFixed(i())
    }, this);
    t.displayLastUpdated = ko.pureComputed(function () {
        return t.lastUpdated().format("MM/DD/YYYY hh:mm:ss A")
    }, this);
    t.displaySpread = ko.pureComputed(function () {
        return t.spread().toFixed(1) + "%"
    }, this);
    t.displayHigh = ko.pureComputed(function () {
        return t.high().toFixed(i())
    }, this);
    t.displayLow = ko.pureComputed(function () {
        return t.low().toFixed(i())
    }, this);
    t.displayBaseVolume = ko.pureComputed(function () {
        return t.baseVolume().toFixed(2)
    }, this);
    t.displayMarketVolume = ko.pureComputed(function () {
        return t.marketVolume().toFixed(2)
    }, this);
    t.displayChange = ko.pureComputed(function () {
        return t.change().toFixed(1) + "%"
    }, this);
    t.dispose = function () {
        for (var n in t) t.hasOwnProperty(n) && ko.isComputed(t[n]) && t[n].dispose()
    };
    t.update = function (n) {
        t.updateSummary(n.Summary);
        t.marketCurrencyName = n.Market.MarketCurrencyLong;
        t.title = t.marketCurrencyName + " (" + t.marketCurrency + ")";
        t.keywords = t.marketCurrencyName + " " + t.marketCurrency;
        t.created(new moment(n.Market.Created ? n.Market.Created + " Z" : 0));
        t.lastUpdated(new moment);
        t.isActive(n.Market ? n.Market.IsActive : !1);
        t.isVerified(n.IsVerified ? n.IsVerified : !1);
        t.isSponsored(n.Market ? n.Market.IsSponsored : !1);
        t.imgPath = n.Market.LogoUrl ? n.Market.LogoUrl : "/Content/img/symbols/" + t.marketCurrency + ".png";
        t.urlPath = "/Market/Index?MarketName=" + t.marketName
    };
    t.updateSummary = function (n) {
        t.marketName = n.MarketName;
        dash = t.marketName ? t.marketName.indexOf("-") : 0;
        t.baseCurrency = t.marketName ? t.marketName.substr(0, dash) : "";
        t.marketCurrency = t.marketName ? t.marketName.substr(dash + 1) : "";
        t.prevDay(n.PrevDay ? n.PrevDay : 0);
        t.last(n.Last ? n.Last : 0);
        t.ask(n.Ask ? n.Ask : 0);
        t.bid(n.Bid ? n.Bid : 0);
        t.high(n.High ? n.High : 0);
        t.low(n.Low ? n.Low : 0);
        t.spread(100 * (t.ask() - t.bid()) / t.ask());
        t.baseVolume(n.BaseVolume ? n.BaseVolume : 0);
        t.marketVolume(n.Volume ? n.Volume : 0);
        t.change(t.prevDay() ? (t.last() - t.prevDay()) / t.prevDay() * 100 : 0)
    };
    t.update(n)
}

function marketHistoryEntry(n) {
    var t = this,
        i;
    t.date = new moment;
    t.price = 0;
    t.units = 0;
    t.cost = 0;
    t.orderType = "NONE";
    t.displayDate = ko.pureComputed(function () {
        return t.date.format("MM/DD/YYYY hh:mm:ss A")
    }, this);
    t.displayPrice = ko.pureComputed(function () {
        return t.price.toFixed(8)
    }, this);
    t.displayUnits = ko.pureComputed(function () {
        return t.units.toFixed(8)
    }, this);
    t.displayCost = ko.pureComputed(function () {
        return t.cost.toFixed(8)
    }, this);
    i = function (n) {
        t.date = new moment(n.TimeStamp + " Z");
        t.price = n.Price;
        t.units = n.Quantity;
        t.cost = n.Total;
        t.orderType = n.OrderType
    };
    i(n)
}

function closedOrderEntry(n) {
    var t = this;
    n.TimeStamp || (n.TimeStamp = n.Opened);
    n.Commission || (n.Commission = n.CommissionPaid);
    n.OrderType || (n.OrderType = n.Type);
    t.closed = new moment(n.Closed + " Z");
    t.timeStamp = new moment(n.TimeStamp + " Z");
    t.exchange = n.Exchange;
    t.orderType = n.OrderType;
    t.limit = n.Limit;
    t.filled = n.Quantity - n.QuantityRemaining;
    t.quantity = n.Quantity;
    t.remaining = n.QuantityRemaining;
    t.pricePerUnit = n.PricePerUnit;
    !t.pricePerUnit && n.Quantity > 0 && (t.pricePerUnit = truncateDecimals(n.Price / n.Quantity, 8));
    t.price = n.Price;
    (n.OrderType == "LIMIT_SELL" || n.OrderType == "MARKET_SELL") && (t.total = n.Price - n.Commission);
    (n.OrderType == "LIMIT_BUY" || n.OrderType == "MARKET_BUY") && (t.total = n.Price + n.Commission)
}

function openOrderEntry(n) {
    var t = this;
    t.update = function (n) {
        t.action = "action";
        t.opened = new moment(n.Opened + " Z");
        t.exchange = n.Exchange;
        t.orderType = n.OrderType;
        t.limit = n.Limit;
        t.filled = n.Quantity - n.QuantityRemaining;
        t.quantity = n.Quantity;
        t.quantityRemaining = n.QuantityRemaining;
        t.pricePerUnit = n.PricePerUnit;
        t.orderUuid = n.OrderUuid;
        t.cancelInitiated = n.CancelInitiated;
        t.immediateOrCancel = n.ImmediateOrCancel;
        t.condition = n.Condition;
        t.isConditional = n.IsConditional;
        t.conditionTarget = n.ConditionTarget;
        var i = t.limit * t.quantity,
            r = i * .0025;
        (n.OrderType == "LIMIT_SELL" || n.OrderType == "MARKET_SELL") && (t.total = i - r);
        (n.OrderType == "LIMIT_BUY" || n.OrderType == "MARKET_BUY") && (t.total = i + r)
    };
    t.update(n)
}

function balanceEntry(n) {
    var t = this;
    t.action = "action";
    t.currencyLong = "";
    t.currency = "";
    t.coinType = "";
    t.baseAddress = "";
    t.available = ko.observable(0);
    t.pending = ko.observable(0);
    t.held = ko.pureComputed(function () {
        return t.total() - t.available()
    }, this);
    t.total = ko.observable(0);
    t.bitcoinRate = ko.observable(0);
    t.bitcoinValue = ko.pureComputed(function () {
        return t.currency == "BTC" ? t.total() : t.bitcoinRate() * t.total()
    }, this);
    t.isActive = ko.observable(!1);
    t.notice = ko.observable("");
    t.bitcoinMarket = null;
    t.ethereumMarket = null;
    t.fiatMarket = null;
    t.change = ko.observable(0);
    t.hasMarket = ko.observable(!1);
    t.update = function (n) {
        t.currencyLong = n.Currency.CurrencyLong;
        t.currency = n.Currency.Currency;
        t.coinType = n.Currency.CoinType;
        t.baseAddress = n.Currency.BaseAddress;
        t.available(n.Balance.Available);
        t.pending(n.Balance.Pending);
        t.total(n.Balance.Balance);
        t.bitcoinRate(n.BitcoinMarket ? n.BitcoinMarket.Last : 0);
        t.isActive(n.Currency.IsActive);
        t.notice(n.Currency.Notice);
        t.bitcoinMarket = n.BitcoinMarket;
        t.ethereumMarket = n.EthereumMarket;
        t.fiatMarket = n.FiatMarket;
        t.bitcoinMarket ? (t.bitcoinMarket.PrevDay = t.bitcoinMarket.PrevDay ? t.bitcoinMarket.PrevDay : 0, t.change(t.bitcoinMarket.PrevDay ? (t.bitcoinMarket.Last - t.bitcoinMarket.PrevDay) / t.bitcoinMarket.PrevDay * 100 : 0), t.hasMarket(!0)) : (t.change(0), t.hasMarket(!1))
    };
    t.update(n)
}
var orderBookEntry = function (n, t) {
        var i = this,
            r = t.precision,
            f = t.precisionShort,
            u, e;
        i.rate = ko.observable(0).extend({
            numeric: r
        });
        i.size = ko.observable(0).extend({
            calculateDelta: "",
            numeric: r
        });
        i.total = ko.observable(0).extend({
            calculateDelta: "",
            numeric: r
        });
        i.sumBase = ko.observable(0).extend({
            calculateDelta: "",
            numeric: r
        });
        i.sumMarket = ko.observable(0).extend({
            calculateDelta: "",
            numeric: r
        });
        i.orderSize = ko.observable(0);
        i.displayRate = ko.pureComputed(function () {
            return i.rate().toFixed(r)
        }, this);
        i.displaySize = ko.pureComputed(function () {
            return i.size().toFixed(r)
        }, this);
        i.displayTotal = ko.pureComputed(function () {
            return i.total().toFixed(f)
        }, this);
        i.displaySumBase = ko.pureComputed(function () {
            return i.sumBase().toFixed(f)
        }, this);
        i.displaySumMarket = ko.pureComputed(function () {
            return i.sumMarket().toFixed(f)
        }, this);
        i.clickRate = function () {
            u("data-update-rate", i.rate())
        };
        i.clickSize = function () {
            u("data-update-size", i.size())
        };
        i.sellToDepth = function () {
            u("data-sellToDepth", {
                rate: i.rate(),
                sumMarket: i.sumMarket(),
                sumBase: i.sumBase()
            })
        };
        i.buyToDepth = function () {
            u("data-buyToDepth", {
                rate: i.rate(),
                sumMarket: i.sumMarket(),
                sumBase: i.sumBase()
            })
        };
        u = function (n, t) {
            $("#event-store").trigger({
                type: n,
                serviceData: t
            })
        };
        i.update = function (n) {
            i.size(n.Quantity);
            i.total(i.rate() * n.Quantity)
        };
        e = function (n) {
            i.rate(n.Rate);
            i.update(n)
        };
        e(n)
    },
    bittrex = bittrex || {};
$(function () {
    "use strict";

    function n() {
        var n = new bittrexVersion;
        return {
            version: n
        }
    }
    var t = bittrex || {};
    bittrex = n();
    bittrex = $.extend({}, bittrex, t)
});
Array.prototype.find || Object.defineProperty(Array.prototype, "find", {
    value: function (n) {
        var i, u, f, t, r;
        if (this == null) throw new TypeError('"this" is null or not defined');
        if (i = Object(this), u = i.length >>> 0, typeof n != "function") throw new TypeError("predicate must be a function");
        for (f = arguments[1], t = 0; t < u;) {
            if (r = i[t], n.call(f, r, t, i)) return r;
            t++
        }
        return undefined
    }
});
var loadAlertSetting = function () {
        var n = {
                from: "top",
                align: "right"
            },
            t;
        if ($.cookie("alertSetting")) {
            t = $.cookie("alertSetting");
            switch (t) {
                case "topRight":
                    n = {
                        from: "top",
                        align: "right"
                    };
                    break;
                case "topLeft":
                    n = {
                        from: "top",
                        align: "left"
                    };
                    break;
                case "bottomRight":
                    n = {
                        from: "bottom",
                        align: "right"
                    };
                    break;
                case "bottomLeft":
                    n = {
                        from: "bottom",
                        align: "left"
                    };
                    break;
                case "disable":
                    n = null
            }
        }
        return n
    },
    parseException = function (n) {
        var t = {
            exception: n,
            url: "https://bittrex.zendesk.com/hc/en-us/articles/115000240791"
        };
        switch (n) {
            case "2FA_FAILED":
                t.message = "The two-factor authenticator code you entered has either expired or is invalid.  Please verify that your clock is still synced and try again.";
                break;
            case "SEND_TO_DEPOSIT_ADDRESS_DENIED":
                t.message = "The address you entered is the same as the Bittrex wallet.  This coin cannot be sent directly between Bittrex accounts.";
                break;
            case "WITHDRAWAL_LIMIT_REACHED_24H_ENHANCED":
                t.message = "Enhanced account withdraw limit has been reached.  Please try again in 24 hours.";
                break;
            case "WITHDRAWAL_LIMIT_REACHED_24H_BASIC":
                t.message = "Basic account withdraw limit has been reached.  Please try again in 24 hours.  To increase your limits, please verify your account to the Enhanced level.";
                break;
            case "WITHDRAWAL_LIMIT_REACHED_24H_UNVERIFIED":
                t.message = "Unverified account withdraw limit has been reached.  Please try again in 24 hours. To increase your limits, please verify your account.";
                break;
            case "WITHDRAWAL_LIMIT_REACHED_24H_NO_2FA":
                t.message = "Your account does not have two-factor authentication and has hit your daily withdrawal limit.  Please enable two-factor to increase your limits.";
                break;
            case "PASSWORD_RESET_24H_LOCK":
                t.message = "Withdraws are locked due to a password reset within the past 24 hours.  Please wait until 24 hours has passed to submit a withdraw.";
                break;
            case "LOGIN_2FA_LOCK_2M":
                t.message = "Please wait a minimum of two minutes after login to submit your withdraw.";
                break;
            case "REUSED_2FA_TOKEN":
                t.message = "Please wait 30 seconds for a new authenticator code.";
                break;
            case "WHITELIST_VIOLATION_IP":
                t.message = "The IP Address you are attempting to withdraw from is not in your IP Whitelist.  Please add your current public IP address to your whitelist.";
                break;
            case "WHITELIST_VIOLATION_WITHDRAWAL_ADDRESS":
                t.message = "The address you are attempting to withdraw to is not in your address whitelist.  Please add the address to your whitelist in order to perform this withdraw.";
                break;
            case "DUST_TRADE_DISALLOWED_MIN_VALUE_50K_SAT":
                t.message = "All trades submitted must be .00050000 BTC in value or greater.  Quantity * Price must be greater than .00050000 BTC.";
                break;
            case "INVALID_CRYPTO_ADDRESS":
                t.message = "The address you submitted is not valid for this coin.";
                break;
            case "ZERO_OR_NEGATIVE_NOT_ALLOWED":
                t.message = "Please review your order entry. The quantity or price you entered is zero or negative.";
                break;
            case "AMOUNT_NOT_INTEGER":
                t.message = "Your withdrawal amount must be an integer.  See the withdrawal instructions for the currency for more details.";
                break;
            case "TOO_MANY_DECIMALS":
                t.message = "Your withdrawal amount has too many decimals.  See the withdrawal instructions for the currency for more details.";
                break;
            case "MIN_TRADE_REQUIREMENT_NOT_MET":
                t.message = "Your trade quantity is too small.";
                break;
            case "INVALID_ADDRESS":
                t.message = "The address you submitted is not valid for this blockchain.";
                break;
            case "ACCOUNT_NOT_VERIFIED":
                t.message = "Your account must be verified to deposit, trade, or withdraw.";
                break;
            default:
                t.message = t.exception
        }
        return t
    },
    showAlert = function (n, t, i, r) {
        "use strict";
        var e = loadAlertSetting();
        if (e) {
            var u = "fa fa-check",
                o = 6e3,
                f = {
                    message: n,
                    icon: u
                },
                s = {
                    type: t,
                    delay: o,
                    mouse_over: "pause",
                    showProgressbar: !0,
                    placement: e,
                    template: '<div data-notify="container" class="col-xs-11 col-sm-5 col-md-4 col-lg-3 alert alert-{0}" role="alert"><button type="button" aria-hidden="true" class="close" data-notify="dismiss">×<\/button><span data-notify="icon" class="pull-left"><\/span> <span data-notify="title" style="display:block; font-weight:bold; font-size:14px">{1}<\/span> <span data-notify="message" >{2}<\/span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"><\/div><\/div><a href="{3}" target="{4}" data-notify="url"><\/a><\/div>'
                };
            i && (f.title = i);
            r && (f.url = r, f.target = "_blank");
            switch (t) {
                case "success":
                    u = "fa fa-check";
                    break;
                case "info":
                    u = "fa fa-info";
                    o = 3e3;
                    break;
                case "warning":
                    u = "fa fa-warning";
                    break;
                case "danger":
                    u = "fa fa-times-circle";
                    break;
                default:
                    t = "warning";
                    u = "fa fa-warning"
            }
            $.notify(f, s)
        }
    },
    authenticationRedirect = function (n) {
        "use strict";
        switch (n.status) {
            case 401:
                window.location.replace("/Account/Login");
                break;
            case 404:
                window.location.reload(!0)
        }
    },
    setupDatatableToolbar = function (n) {
        var r, i, t;
        if (n.customToolbar) {
            if ($("#" + n.id + "_wrapper .dt-buttons a.btn").appendTo("#" + n.customToolbar).addClass("hidden-xs hidden-sm hidden-md btn-toolbar"), $("#" + n.id + "_filter").length) {
                $("#" + n.id + "_filter").hide();
                $("#" + n.customToolbar).append('<div class="dataTables_filter" id="' + n.id + '_filter2" style="float:right"><label style="min-width:200px"><div style="float: left; padding-top: 5px; padding-right: 4px;">Search:<\/div><input class="form-control input-sm" style="width: 12em" id="' + n.id + '_filter_input2" type="search" placeholder=""><\/label><\/div>');
                t = $("#" + n.id).DataTable();
                $("#" + n.id + "_filter_input2").val(t.search());
                $("#" + n.id + "_filter_input2").on("keyup change", function () {
                    t.search($(this).val()).draw()
                })
            }
            if ($("#" + n.id + "_length").length) {
                r = n.id + "_length2";
                i = n.id + "_length_option2";
                $("#" + n.id + "_length").hide();
                $("#" + n.customToolbar).append('<div class="dataTables_length" id="' + r + '" style="float:right"><label><div style="float: left; padding-top: 5px; padding-right: 4px;">Display&nbsp;<\/div><select id="' + i + '" class="form-control input-sm" style="float: left; width: 70px"><div style=""><option value="10" selected="selected">10<\/option><option value="25">25<\/option><option value="50">50<\/option><option value="100">100<\/option><\/div><\/select><div style="float: left; padding-top: 5px; padding-left: 4px; padding-right: 20px;">&nbsp;rows<\/div><\/label><\/div>');
                t = $("#" + n.id).DataTable();
                t.page.len($("#" + i).val()).draw();
                $("#" + i).on("change", function () {
                    var t = $("#" + n.id).DataTable();
                    t.page.len($(this).val()).draw()
                })
            }
        }
    },
    screen_xs_size = function () {
        "use strict";
        return $("#media-width-detection-element").css("width") === "0px"
    },
    screen_sm_size = function () {
        "use strict";
        return $("#media-width-detection-element").css("width") === "768px"
    },
    screen_md_size = function () {
        "use strict";
        return $("#media-width-detection-element").css("width") === "992px"
    },
    screen_lg_size = function () {
        "use strict";
        return $("#media-width-detection-element").css("width") === "1200px"
    },
    getUrlParameters = function (n, t, i) {
        "use strict";
        for (var r, f = t.length ? t : window.location.search, e = f ? f.split("?")[1].split("&") : [], o = !0, s = e.length, u = 0; u < s; u++) {
            if (r = e[u].split("="), r[0] == n) return i ? decodeURIComponent(r[1]) : r[1];
            o = !1
        }
        if (!o) return !1
    },
    truncateDecimals = function (n, t) {
        "use strict";
        var i = Math.pow(10, t),
            r = n * i,
            u = Math[r < 0 ? "ceil" : "floor"](r);
        return u / i
    }