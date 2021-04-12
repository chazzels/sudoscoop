var StudentController = require('./studentController');

class SudoSchool extends StudentController {
	constructor() {
		super();
		(async () => {
			await this.initialConnection();
			await this.studentSignIn();
		})();
		
	}
	
}

var instance = new SudoSchool();

