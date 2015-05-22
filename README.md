Paypal for Meteor
=============

Meteor Package for easy Paypal payment processing, extended to support the following additional features supported by the REST API:

- Store card details in the vault
- Use a stored card for a transaction
- Delete a stored card
- Lookup stored details for a specific card
- List all cards based on filter criteria
- Lookup a sale to verify it has been successful
- Refund a sale (partial/full)

If you only require basic authorisation / ability to make a payment then use the [original package](https://github.com/DavidBrear/meteor-paypal )

### Usage
```console
meteor add sandelld:paypal
```

#### Setup

If you haven't already, sign up for a developer account at: [https://developer.paypal.com/](https://developer.paypal.com/)

Create a sandbox application and copy your *REST API CREDENTIALS*.

Create a file `server/paypal_config.js` including:
``` javascript
  Meteor.Paypal.config({
    'host': 'api.sandbox.paypal.com',
    'port': '',
    'client_id': 'Your Paypal Client Id',
    'client_secret': 'Your Paypal Client Secret'
  });
```

#### Basic

Format is `Meteor.Paypal.*transaction_type*({ {/*card data*/}, {/*transaction data*/}, function(err, res){...})`

```javascript
  Meteor.Paypal.authorize({
      name: 'Buster Bluth',
      number: '4111111111111111',
      type: 'visa',
      cvv2: '123',
      expire_year: '2015',
      expire_month: '01'
    },
    {
      total: '100.00',
      currency: 'GBP'
    },
    function(error, results){
      if(error)
        //Deal with Error
      else
        //results contains:
        //  saved (true or false)
        //  if false: "error" contains the reasons for failure
        //  if true: "payment" contains the transaction information
    });
```

For information on the **payment** object returned see [Paypal's Payment Option Documentation](https://developer.paypal.com/webapps/developer/docs/api/#common-payments-objects)

Transaction types are: `Meteor.Paypal.authorize` and
`Meteor.Paypal.purchase` for the difference, see [Paypal's
Documentation](https://developer.paypal.com/webapps/developer/docs/api/#payments)

#### Enhanced Features

For additional information on fields, check out the [Paypal REST API documentation](https://developer.paypal.com/docs/api/)

**Store a credit card in the Vault:**

``` javascript
      var cardData = {
      name: 'Buster Bluth',
      number: '4111111111111111',
      type: 'visa',
      cvv2: '123',
      expire_year: '2015',
      expire_month: '01'
      external_customer_id: "123456789",
      merchant_id: "company_name",
      external_card_id: "abcdefghijk123457" 
      };

      Meteor.Paypal.vaultCreate(cardData, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });
```

**Pay with a stored card:**

``` javascript
      var cardData = { credit_card_id: "CARD-7XT34685RB132680FKVNVW2Y" }; // stored card reference

      Meteor.Paypal.purchase(cardData, {total: '6.50', currency: 'GBP'}, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });
```

**Delete a stored card**

``` javascript

      var cardRef = "CARD-7XT34685RB132680FKVNVW2Y"; // stored card reference

      Meteor.Paypal.vaultDelete(cardRef, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });

``` 

**Get details back for a stored card**

``` javascript

      var cardRef = "CARD-7XT34685RB132680FKVNVW2Y"; // stored card reference

      Meteor.Paypal.vaultGet(cardRef, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });

``` 

**Lookup card details based on a filter**

``` javascript

      var cardFilter = "?merchant_id=yourcompanyname"; // use any parameters you stored with the card

      Meteor.Paypal.vaultList(cardFilter, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });
```

**Lookup a sale**


``` javascript

      var txRef = "86P78153J2013135X"; // returned when you execute a payment 

      Meteor.Paypal.saleLookup(txRef, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });
```

**Refund a sale**

``` javascript

      var txRef = "86P78153J2013135X"; // returned when you execute a payment
      var refundInfo = {total: '2.00', currency: 'GBP'}

      Meteor.Paypal.saleRefund(txRef, refundInfo, function(err, results){
        if (err) console.error(err);
        else console.log(results);
      });
``` 

### Acknowledgements

Full credit to David Brear for building the package, I've just extended his work to include additional features that I needed for my project.
