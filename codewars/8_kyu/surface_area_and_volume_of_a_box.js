// Write a function that returns the total surface area and 
// volume of a box as an array: [area, volume].

function getSize(l, w, h) {
	//find the surface area
	var area = 2*l*w + 2*l*h + 2*w*h;
	

	//find the volume
	var volume = l*w*h;

	var result = [area, volume];
	return result;

}

getSize(10, 10, 10);

// Test.assertSimilar(getSize(10, 10, 10), [600, 1000]);