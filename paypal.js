Paypal = {

  account_options: {},
  // authorize submits a payment authorization to Paypal
  authorize: function(card_info, payment_info, callback){
    Meteor.call('paypal_submit', 'authorize', card_info, payment_info, callback);
  },
  purchase: function(card_info, payment_info, callback){
    Meteor.call('paypal_submit', 'sale', card_info, payment_info, callback);
  },
  vaultCreate: function(cardInfo, callback){
    Meteor.call('paypal_vault', 'create', cardInfo, callback);
  },
  vaultGet: function(cardRef, callback){
    Meteor.call('paypal_vault', 'get', null, cardRef, callback);
  },  
  vaultDelete: function(cardRef, callback){
    Meteor.call('paypal_vault', 'delete', null, cardRef, callback);
  },        
  vaultList: function(cardFilter, callback){
    Meteor.call('paypal_vault', 'list', cardFilter, callback);
  },
  saleLookup: function(saleId, callback) {
    Meteor.call('paypal_sale', 'get', saleId, callback);
  },
  saleRefund: function(saleId, refund_data, callback) {
    Meteor.call('paypal_sale', 'refund', saleId, refund_data, callback);
  },         
  //config is for the paypal configuration settings.
  config: function(options){
    this.account_options = options;
  },
  payment_json: function(){
    return {
      "intent": "sale",
      "payer": {
        "payment_method": "credit_card",
        "funding_instruments": []},
      "transactions": []
    };
  },
  //parseCardData splits up the card data and puts it into a paypal friendly format.
  parseCardData: function(data){

    var cardData;
    var first_name = '', last_name = '';
    if (data.name){
      first_name = data.name.split(' ')[0];
      last_name = data.name.split(' ')[1];
    }
    else {
      first_name = data.first_name;
      last_name = data.last_name;
    }
    //check if we are passing in a token or credit card information
    if (data.credit_card_id) {
      cardData = {
          credit_card_token: {
            credit_card_id: data.credit_card_id
          }
      };
    }
    else { //CC info
      cardData = {
        credit_card: {
          type: data.type,
          number: data.number,
          first_name: first_name,
          last_name: last_name,
          cvv2: data.cvv2,
          expire_month: data.expire_month,
          expire_year: data.expire_year
        }
      };
    }
    return cardData;
  },
  parsePayerInfo: function(data) { // future use to pass in a payer's information

    //Derive payer info to pass through to PP
    var first_name = '', last_name = '';

    if (data.name){
      first_name = data.name.split(' ')[0];
      last_name = data.name.split(' ')[1];
    }
    else {
      first_name = data.first_name;
      last_name = data.last_name;
    }

    var payerInfo = {
          first_name: first_name,
          last_name: last_name,
          email: data.email,
          salutation: data.salutation
    };
    return payerInfo;

  },
  //parsePaymentData splits up the card data and gets it into a paypal friendly format.
  parsePaymentData: function(data){
    return {amount: {total: data.total, currency: data.currency}};
  }
};

if(Meteor.isServer){

  Meteor.startup(function(){

    var paypal_sdk = Npm.require('paypal-rest-sdk');
    var Fiber = Npm.require('fibers');
    var Future = Npm.require('fibers/future');

    Meteor.methods({
      paypal_submit: function(txType, cardData, paymentData, payerInfo) {
        
        //setup app variables from paypal_config.js as defined in the docs
        paypal_sdk.configure(Paypal.account_options);

        // setup the future
        var fut = new Future();
        this.unblock();

        //setup payment json
        var payment_json = Paypal.payment_json();

        //specify transaction type
        payment_json.intent = txType;
        
        // either set paypal payment type of CC data
        if(cardData === null) {
          payment_json.payer = {
            payment_method: 'paypal'
          };
          payment_json.redirect_urls = Paypal.account_options.redirect_urls;
        } else {
          payment_json.payer.funding_instruments.push(Paypal.parseCardData(cardData));
        }
        
        // format payment data 
        payment_json.transactions.push(Paypal.parsePaymentData(paymentData));
        
        // create the payment 
          paypal_sdk.payment.create(payment_json, Meteor.bindEnvironment(function(err, payment){
            if (err){
              fut.return({success: false, error: err});
            } else {
              fut.return({success: true, payment: payment});
            }
          },
          function(e){
            console.error(e);
          }));
          return fut.wait();

    },
    // Method to enable vault actions: store, get, delete, list
    paypal_vault: function(txType, cardData, cardRef) {
        
        //setup app variables from paypal_config.js as defined in the docs
        paypal_sdk.configure(Paypal.account_options);

        // setup the future
        var fut = new Future();
        this.unblock();

        // check which type of vault action we're dealing with
        switch (txType) {
          case 'create': // store new credit card
              paypal_sdk.credit_card.create(cardData, Meteor.bindEnvironment(function(err, result){
                  if (err){
                    fut.return({success: false, error: err});
                  } else {
                    fut.return({success: true, result: result});
                  }
                },
                function(e){
                  console.error(e);
                }));
                return fut.wait();
          case 'get': // lookup a stored credit card
              paypal_sdk.credit_card.get(cardRef, Meteor.bindEnvironment(function(err, result){
                  if (err){
                    fut.return({success: false, error: err});
                  } else {
                    fut.return({success: true, result: result});
                  }
                },
                function(e){
                  console.error(e);
                }));
                return fut.wait();              
          case 'delete': // delete stored credit card
              paypal_sdk.credit_card.delete(cardRef, Meteor.bindEnvironment(function(err, result){
                  if (err){
                    fut.return({success: false, error: err});
                  } else {
                    fut.return({success: true, result: result});
                  }
                },
                function(e){
                  console.error(e);
                }));
                return fut.wait();                  
          default: //list cards based on a filter
              paypal_sdk.credit_card.get(cardData, Meteor.bindEnvironment(function(err, result){
                  if (err){
                    fut.return({success: false, error: err});
                  } else {
                    fut.return({success: true, result: result});
                  }
                },
                function(e){
                  console.error(e);
                }));
                return fut.wait();
        }

    },
    paypal_sale: function(txType, saleId, refund_data) {
        //setup app variables from paypal_config.js as defined in the docs
        paypal_sdk.configure(Paypal.account_options);

        // setup the future
        var fut = new Future();
        this.unblock();

        // check what type of sale transaction we're dealing with
        switch (txType) {
          case 'refund': // partial/full refund
              paypal_sdk.sale.refund(saleId, Paypal.parsePaymentData(refund_data), Meteor.bindEnvironment(function(err, result){
                  if (err){
                    fut.return({success: false, error: err});
                  } else {
                    fut.return({success: true, result: result});
                  }
                },
                function(e){
                  console.error(e);
                }));
                return fut.wait();                
          default: // lookup a sale
              paypal_sdk.sale.get(saleId, Meteor.bindEnvironment(function(err, result){
                  if (err){
                    fut.return({success: false, error: err});
                  } else {
                    fut.return({success: true, result: result});
                  }
                },
                function(e){
                  console.error(e);
                }));
                return fut.wait();
        }

    }         
  }); // Meteor.methods

// execute the payment 
Paypal.execute = function execute(payment_id, payer_id, callback) {
  paypal_sdk.payment.execute(payment_id, {payer_id: payer_id}, Paypal.account_options, callback);
};

}); // Meteor.isServer
}

