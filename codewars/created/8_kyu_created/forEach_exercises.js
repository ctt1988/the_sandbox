//problem 1
var words = ["Ho", "Chi", "Minh", "City", "was", "once", "known", "as", "Prey", "Nokor"];

var answer = [];

words.forEach(function(str) {
  answer.push(str.toUpperCase());
});

console.log(answer)

//problem 2
var squareMe = [0, 1, 10, 24, 595]

var answer = [];

squareMe.forEach(function(n) {
  answer.push(Math.pow(n, 2));
});

console.log(answer)