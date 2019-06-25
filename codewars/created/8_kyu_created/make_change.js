//snippet of code to calculate change from payment
var makeChange = function(price, payment) {
	//setting price=3.5 and payment=4 in this example
  var changeLeft = Math.round(100*payment - 100*price);
  //changeLeft is now 50
  if (changeLeft < 0) {return [0,0,0,0]};
  //changeLeft is > 0. this is dead code
  var results = [], quantity;
  //setting results as an empty array and quantity(quantity will be used later)
  [25, 10, 5, 1].forEach(function(val){
  	//
    quantity = Math.floor(changeLeft/val);
    changeLeft -= quantity * val;
    results.push(quantity);
  });
  return results;
};

makeChange(3.5, 4);