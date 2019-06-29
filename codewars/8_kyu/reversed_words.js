    
function reverseWords(str){
	return str.split(' ').reverse().join(' ');
}

reverseWords('hello world!');

// Test.assertEquals(reverseWords("hello world!"), "world! hello")
// Test.assertEquals(reverseWords("yoda doesn't speak like this" ),  "this like speak doesn't yoda")