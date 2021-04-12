var StudentController = require('./studentController');

class SudoSchool extends StudentController {
	constructor() {
		super();
		(async () => {
			await this.initialConnection();
			await this.studentSignIn();
		})();
	}
	
	async readAllContent(classCode) {
		
		
		
	}
	
	async readAllPosts(classCode) {
		
		
		
	}
	
	// get all the dicussion posts made by the user.
	async getUserPosts() {
		
		
		
	}
	
	// flood a post with a lot of views. 
	async viralPost(postid, viewAddCount) {
		
		
		
	}
	
	// flood all posts in a unit with views.
	async viralUnit(classCode, unitNum, viewAddCount) {
		
		
		
	}
	
}

var instance = new SudoSchool();

