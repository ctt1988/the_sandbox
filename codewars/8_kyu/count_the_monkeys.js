function monkeyCount(n) {
//take n and loop through it
var finalNumber = [];

for(i=1; i<=n; i++){
	//push numbers into an array
	finalNumber.push(i);
}

return finalNumber;

}

monkeyCount(5);

// Test.assertSimilar((monkeyCount(5)), [1, 2, 3, 4, 5]);
// Test.assertSimilar((monkeyCount(3)), [1, 2, 3]);
// Test.assertSimilar((monkeyCount(9)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);