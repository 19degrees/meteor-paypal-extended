Package.describe({
	summary: "A server side PayPal package that helps make restful API calls to Paypal.",
	version: "1.2.0",
	name: "19degrees:paypal",
	git: "https://github.com/19degrees/meteor-paypal-extended"
});

Npm.depends({
	"paypal-rest-sdk": "0.6.3"
});

Package.on_use(function(api) {
	api.add_files("paypal.js", ["client", "server"]);
	api.export("Paypal", ["server"]);
});

Package.on_test(function(api) {
	//need to add some tests
});
