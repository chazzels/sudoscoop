const chalk = require('chalk');

class Logger {
	
	constructor(name) {
		
		this.logHeader = name;
		this.debugLogs = false;
		
	}
	
	// log a message to the console. 
	log(module, ...msgs) {
		
		let msg = '';
		
		msgs.forEach(function(value, key, map) {
			msg += value.toString() + ' ';
		});
		
		console.log(this.logHeader + '::' + module + ': ' + msg);
		
	}
	
	// log a debug message.
	debug(module, ...msgs) {
		
		if(this.debugLogs) {
			
			let msg = '';
			
			msgs.forEach(function(value, key, map) {
				msg += value.toString() + ' ';
			});
			
			console.log(chalk.green(this.logHeader + '::DEBUG::' + module + ': ' + msg));
			
		}
		
	}
	
}

module.exports = Logger;