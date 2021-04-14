var StudentController = require('./core/studentController');

class SudoSchool extends StudentController {
	constructor() {
		super('SudoSchool', 'https://purdueglobal.brightspace.com');
		
		this.jobs = new Array();
		this.processSettings();
		
		(async () => {
			await this.initialConnection();
			await this.studentSignIn();
			await this.jobHandler();
		})();
		
	}
	
	// process the passed in settings to set the tasks to be completed.
	processSettings() {
		
		let tempSetting;
		
		this.log('Settings', 'Processing...');
		
		for(var i=0;i<this.settings.length;i++) {
			
			if(this.settings[i] == SudoSchool.VIRALPOST) {
				
				this.jobs.push({
					name: SudoSchool.VIRALPOST, 
					classCode: this.settings[this.settings.indexOf(SudoSchool.VIRALPOST)+1],
					target: this.settings[this.settings.indexOf(SudoSchool.VIRALPOST)+2],
				});
				
				i = i + 2;
				
			} else if(this.settings[i] == SudoSchool.READALLPOSTS) {
				
				this.jobs.push({
					name: SudoSchool.READALLPOSTS, 
					classCode: this.settings[this.settings.indexOf(SudoSchool.READALLPOSTS)+1],
					target: this.settings[this.settings.indexOf(SudoSchool.READALLPOSTS)+2],
				});
				
				i = i + 2;
				
			} else if(this.settings[i] == SudoSchool.READALLCONTENT){
				
				this.jobs.push({
					name: SudoSchool.READALLCONTENT, 
					classCode: this.settings[this.settings.indexOf(SudoSchool.READALLCONTENT)+1],
				});
				
				i = i + 1;
				
			}
			
		}
		
		this.log('Settings', 'Processed');
		
	}
	
	
	//process the jobs after the connection and sign in have completed. 
	async jobHandler() {
		
		this.log('JobHandler', this.jobs);
		
	}
	
	// flood a post with a lot of views. 
	async viralPost(postid, viewAddCount) {
		
		this.log(SudoSchool.VIRALPOST, 'post views: 0');
		
	}
	
	// read all the post in a unit a few times. 
	async viralDiscusison(unit) {
		
		
		
	}
	
	// visits every post in a class code 
	async readAllPosts(classCode, unitNum) {
		
		
		
	}
	
	// visits all content pages
	async readAllContent(classCode) {
		
		
		
	}
	
	// get all the dicussion posts made by the user.
	async getUserPosts() {
		
		
		
	}
	
	// flood all posts in a unit with views.
	async viralUnit(classCode, unitNum, viewAddCount) {
		
		
		
	}
	
}
SudoSchool.VIRALPOST = 'viralpost';
SudoSchool.READALLPOSTS = 'readallposts';
SudoSchool.READALLCONTENT = 'readallcontent';

// TODO: replaced by a export in the future.
var instance = new SudoSchool();

