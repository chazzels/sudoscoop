class ArgumentProcessor {
	constructor(parameters) {
		
		this.settings = parameters;
		this.jobs = new Array();
		
		return this.process(this.settings);
		
	}
	
	process(parameters) {
		
		if(typeof parameters != "undefined") { this.settings = parameters; }
		
		for(var i=0;i<this.settings.length;i++) {
			
			if(this.settings[i] == ArgumentProcessor.VIRALPOST) {
				
				this.jobs.push({
					name: ArgumentProcessor.VIRALPOST, 
					classCode: this.settings[this.settings.indexOf(ArgumentProcessor.VIRALPOST)+1],
					target: this.settings[this.settings.indexOf(ArgumentProcessor.VIRALPOST)+2],
				});
				
				i = i + 2;
				
			} else if(this.settings[i] == ArgumentProcessor.READALLPOSTS) {
				
				this.jobs.push({
					name: ArgumentProcessor.READALLPOSTS, 
					classCode: this.settings[this.settings.indexOf(ArgumentProcessor.READALLPOSTS)+1],
					target: this.settings[this.settings.indexOf(ArgumentProcessor.READALLPOSTS)+2],
				});
				
				i = i + 2;
				
			} else if(this.settings[i] == ArgumentProcessor.READALLCONTENT){
				
				this.jobs.push({
					name: ArgumentProcessor.READALLCONTENT, 
					classCode: this.settings[this.settings.indexOf(ArgumentProcessor.READALLCONTENT)+1],
				});
				
				i = i + 1;
				
			}
			
		}
		
		if(this.jobs.length = 0 && this.settings.length > 0) {
			this.log('ArgumentProcessor', 'Arguments Passed. No valid options found.');
		}
		
		return this.jobs;
		
	}
	
}
ArgumentProcessor.VIRALPOST = 'viralpost';
ArgumentProcessor.READALLPOSTS = 'readallposts';
ArgumentProcessor.READALLCONTENT = 'readallcontent';


module.exports = ArgumentProcessor;