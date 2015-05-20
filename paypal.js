Meteor.Paypal = {

  account_options: {},
  //authorize submits a payment authorization to Paypal
  authorize: function(card_info, payment_info, callback){
    Meteor.call('paypal_submit', 'authorize', card_info, payment_info, callback);
  },
  purchase: function(card_info, payment_info, callback){
    Meteor.call('paypal_submit', 'sale', card_info, payment_info, callback); //extended to include payer info
  },
  validate: function(txRef, callback){ //todo
    Meteor.call('paypal_validate', txRef, callback);
  },  
  vaultStore: function(cardInfo, callback){
    Meteor.call('paypal_vault', 'store', cardInfo, callback);
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
  lookupSale: function(saleId, callback) {
    Meteor.call('paypal_sale', 'get', saleId, callback);
  },
  refundSale: function(saleId, refund_data, callback) {
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
    if (data.credit_card_id) {
      cardData = {
          credit_card_token: {
            credit_card_id: data.credit_card_id
          }
      };
    }
    else {
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
    //console.log(cardData);
    return cardData;
  },
  parsePayerInfo: function(data) {

    var first_name = '', last_name = '';

    if (data.name){
      first_name = data.name.split(' ')[0];
      last_name = data.name.split(' ')[1];
    }
    var payerInfo = {
          first_name: first_name,
          last_name: last_name,
          email: data.email,
          salutation: data.salutation
    };

    //console.log(payerInfo);
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
        paypal_sdk.configure(Meteor.Paypal.account_options);

        var fut = new Future();
        this.unblock();

        switch (txType) {
          case 'adaptive':

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
          default: //sale

              //setup payment json
              var payment_json = Meteor.Paypal.payment_json();

              //specify transaction type
              payment_json.intent = txType;
              
              // either set paypal payment type of CC data
              if(cardData === null) {
                payment_json.payer = {
                  payment_method: 'paypal'
                };
                payment_json.redirect_urls = Meteor.Paypal.account_options.redirect_urls;
              } else {
                payment_json.payer.funding_instruments.push(Meteor.Paypal.parseCardData(cardData));
                // if (payerInfo) {
                //   payment_json.payer.payer_info = Meteor.Paypal.parsePayerInfo(payerInfo);
                // }
              }
              
              payment_json.transactions.push(Meteor.Paypal.parsePaymentData(paymentData));
              //console.log(payment_json);
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
        }

    },
    // Method to enable vault actions: store, get, delete, list
    paypal_vault: function(txType, cardData, cardRef) {
        //setup app variables from paypal_config.js as defined in the docs
        paypal_sdk.configure(Meteor.Paypal.account_options);

        var fut = new Future();
        this.unblock();

        switch (txType) {
          case 'store':
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
          case 'get':
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
          case 'delete':
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
          default: //list
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
        paypal_sdk.configure(Meteor.Paypal.account_options);

        var fut = new Future();
        this.unblock();

        switch (txType) {
          case 'refund':
              paypal_sdk.sale.refund(saleId, Meteor.Paypal.parsePaymentData(refund_data), Meteor.bindEnvironment(function(err, result){
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
          default: //get
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
Meteor.Paypal.execute = function execute(payment_id, payer_id, callback) {
  paypal_sdk.payment.execute(payment_id, {payer_id: payer_id}, Meteor.Paypal.account_options, callback);
};

}); // Meteor.isServer
}


// curl -v --insecure -X GET https://api.sandbox.paypal.com/v1/vault/credit-cards?external_card_id=card-1 \ 
// -H "Content-Type:application/json" \
// -H "Authorization: Bearer <Bearer-Token>" \
// -d '{}'

// curl -v --insecure https://api.sandbox.paypal.com/v1/vault/credit-cards/<Credit-Card-Id> \
// -H "Content-Type:application/json" \
// -H "Authorization: Bearer <Access-Token>"
