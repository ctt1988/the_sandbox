//given the price and payment, determine how much change you should receive. Assume price and payment will always be positve numbers.
function makeChange(price, payment){
  //if the payment is higher than the price, subtract price from payment and that is your change
  if (payment>price){
    var change = payment - price;
  }
  //else if the payment is equal to the price, 0 is your change
  else if(payment===price){
    var change = 0;
  }
  //else, print payment is not suffcient
  else {
    var change = 'Insufficient payment';
  }
  console.log(change);
}

makeChange(4, 4);



