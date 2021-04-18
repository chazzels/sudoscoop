class ArgumentProcessor {
	
	constructor(parameters) {
		
		this.args = parameters;
		this.jobs = new Array();
		
		return this.process(parameters);
		
	}
	
	process(parameters) {
		
		this.jobs = new Array();
		
		for(var i=0;i<parameters.length;i++) {
			
			if(parameters[i] == ArgumentProcessor.VIRALPOST) {
				
				this.jobs.push({
					name: ArgumentProcessor.VIRALPOST, 
					classCode: parameters[parameters.indexOf(ArgumentProcessor.VIRALPOST)+1],
					target: parameters[parameters.indexOf(ArgumentProcessor.VIRALPOST)+2],
				});
				
				i = i + 2;
				
			} else if(parameters[i] == ArgumentProcessor.READALLPOSTS) {
				
				this.jobs.push({
					name: ArgumentProcessor.READALLPOSTS, 
					classCode: parameters[parameters.indexOf(ArgumentProcessor.READALLPOSTS)+1],
					target: parameters[parameters.indexOf(ArgumentProcessor.READALLPOSTS)+2],
				});
				
				i = i + 2;
				
			} else if(parameters[i] == ArgumentProcessor.READALLCONTENT){
				
				this.jobs.push({
					name: ArgumentProcessor.READALLCONTENT, 
					classCode: parameters[parameters.indexOf(ArgumentProcessor.READALLCONTENT)+1],
				});
				
				i = i + 1;
				
			}
			
		}
		
		return this.jobs;
		
	}
	
}
ArgumentProcessor.VIRALPOST = 'viralpost';
ArgumentProcessor.READALLPOSTS = 'readallposts';
ArgumentProcessor.READALLCONTENT = 'readallcontent';


module.exports = ArgumentProcessor;