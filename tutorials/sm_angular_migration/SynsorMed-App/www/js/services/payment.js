angular.module('synsormed.services.payment', [
    'synsormed.services.error',
    'synsormed.env'
])
.service('synsormed.services.payment.PaymentService', [
    'localStorageService',
    '$http',
    '$q',
    'synsormed.services.error.http',
    'synsormed.env.urlBase',
    function(localStorageService, $http, $q, HttpError, urlBase) {
        if(localStorageService.get('setEnv')){
          urlBase.env = localStorageService.get('setEnv')
        }

        //Uncomment if testing credit cards
        //Stripe.setPublishableKey('pk_test_S4Vk8nHld2c9C4868Lw73zuz');

        //Uncomment if using production credit cards
        Stripe.setPublishableKey('pk_live_fnbDiA9kJElwyzgYwg6CQDtN');


        return {
            makePayment: function(encounter, paymentDetails) {
                var deferred = $q.defer();

                Stripe.card.createToken({
                    number: paymentDetails.card,
                    cvc: paymentDetails.cvv,
                    exp_month: paymentDetails.exp.month,
                    exp_year: paymentDetails.exp.year,
                    name: paymentDetails.name,
                    address_zip: paymentDetails.zip
                }, function(code, obj) {
                    console.log(code, obj);
                    if (code === 200) {
                        console.log(encounter);
                        $http.post(urlBase.env + '/v1/rest/encounter/' + encounter.id + '/payment', obj, {timeout: 5000}).then(function(resp) {
                            deferred.resolve(resp.data);
                        }).catch(function(err) {
                            deferred.reject(new HttpError({
                                code: err.status,
                                data: err.data.error
                            }));
                        });

                    } else {
                        deferred.reject(new HttpError({
                            code: code,
                            data: obj.error.message
                        }));
                    }
                });


                return deferred.promise;
            }
        };
    }
])
