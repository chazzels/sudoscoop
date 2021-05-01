var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);

jq.onload = function sudoLabRun() {
	var sudoLabQ = jQuery('.ExamEngine_report_responseLink');
	var qryi = 0;
	if(sudoLabQ.length > 0) {
		setTimeout(function sudoLabQuestionOpen() {
			if (qryi < sudoLabQ.length) {
				sudoLabQ[qryi].click(); qryi++;
				console.log('progress:', Math.round(((qryi / (sudoLabQ.length)) * 100), 2), '%');
				setTimeout(sudoLabQuestionOpen, 40);
			} else {
				teacher.time().score();
				console.log('DONE');
			}
		}, 250);
	} else {
		alert("SudoLabSim: no quiz results found");
	}
	
	var teacher = {
		time: function(mins, secs) {
			if (typeof mins == "undefined") {mins = makeMins(10, 28);}
			if (typeof secs == "undefined") {secs = makeSecs(10, 60);}
			jQuery('#ExamEngineReport\\.timeSpent').text("Time spent: " + mins + " minutes " + secs + " seconds");
			return this;
		},
		score: function(grade) {
			if (typeof grade == "undefined") {grade = "100%"};
			jQuery('#ExamEngineReport\\.score').text(grade.toString());
			jQuery('.ExamEngine_report_barInner').css('width', grade.toString());
			return this;
		}
	}
	
	function makeMins(min, max) {return Math.max(getRandomInt(max), min).toString();}
	function makeSecs(min, max) {return Math.max(getRandomInt(max), min).toString();}
	function getRandomInt(max) {return Math.floor(Math.random() * Math.floor(max));}
	
}