Package.describe({
	summary: "A paypal package that helps make restful API calls to Paypal - extended to support Vault and adaptive payments workflow",
	version: "1.0.2",
	name: "sandelld:paypal",
	git: "https://github.com/sandelld/meteor-paypal.git"
});

Npm.depends({
	"paypal-rest-sdk": "0.6.3"
});

Package.on_use(function(api) {
	api.add_files("paypal.js", ["client", "server"]);
	// api.add_files(["paypal_credit_card_form.html", "paypal_credit_card_form.js"], "client");
	api.export("Paypal", ["client", "server"]);
});

Package.on_test(function(api) {
	//need to add some tests
});
