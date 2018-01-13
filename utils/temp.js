try {
    asyncLoop(ordersBook, function (item, next) {
        // good quantity, you have to pay
        // base quantity in buy action is the left side of market, 
        // so we have to convert it to right side that action help us to pass a good quantity to action buy
        var goodQuantity = baseQuantity / item.Rate;
        if (goodQuantity > 0) {
            if (goodQuantity <= item.Quantity) {
                // buy all good quantity
                bittrex.buylimit({
                    market: reqMarketName,
                    quantity: goodQuantity,
                    rate: item.Rate
                }, function (data, err) {
                    if (err) {
                        // end of buy cycle you buy all base quantity
                        resultMes += `Buy: Quantity_${goodQuantity} --- Rate_${item.Rate} --- Message_${err.message}\n`;
                        totalFail += baseQuantity;
                        baseQuantity -= item.Quantity * item.Rate;
                        return res.json({
                            success: false,
                            message: resultMes,
                            totalSuccess: totalSuccess,
                            totalFail: totalFail
                        });
                    } else {
                        resultMes += `Buy: Quantity_${goodQuantity} --- Rate_${item.Rate} --- Message_Success\n`;
                        totalSuccess += baseQuantity;
                        baseQuantity -= item.Quantity * item.Rate;
                        return res.json({
                            success: true,
                            message: resultMes,
                            totalSuccess: totalSuccess,
                            totalFail: totalFail
                        });
                    }
                });
            } else {
                // buy all order Quantity
                bittrex.buylimit({
                    market: reqMarketName,
                    quantity: item.Quantity,
                    rate: item.Rate
                }, function (data, err) {
                    if (err) {
                        // return res.json({success:false, message: err});
                        resultMes += `Buy: Quantity_${item.Quantity} --- Rate_${item.Rate} --- Message_${err.message}\n`;
                        totalFail += item.Quantity * item.Rate;
                        baseQuantity -= item.Quantity * item.Rate;
                        //if end of loop => return directly
                        if (countLoop === ordersBook.length - 1) {
                            return res.json({
                                success: false,
                                message: resultMes,
                                totalSuccess: totalSuccess,
                                totalFail: totalFail
                            });
                        } else {
                            ++countLoop;
                            next();
                        }
                    } else {
                        resultMes += `Buy: Quantity_${item.Quantity} --- Rate_${item.Rate} --- Message_Success}\n`;
                        totalSuccess += item.Quantity * item.Rate;
                        baseQuantity -= item.Quantity * item.Rate;
                        //if end of loop => return directly
                        if (countLoop === ordersBook.length - 1) {
                            return res.json({
                                success: true,
                                message: resultMes,
                                totalSuccess: totalSuccess,
                                totalFail: totalFail
                            });
                        } else {
                            ++countLoop;
                            next();
                        }
                    }
                });
            }
        }
    }, function (err) {

    });
} catch (err) {
    return res.json({
        success: false,
        message: resultMes,
        totalSuccess: totalSuccess,
        totalFail: totalFail
    });
}
