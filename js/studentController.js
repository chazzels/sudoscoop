// controller for interacting with school portal and perform default actions. 
const puppeteer = require('puppeteer');
const PuppetController = require('./puppetController');
require('dotenv').config();

class StudentController extends PuppetController {
	
	constructor() {
		super('SudoSchool', 'https://purdueglobal.brightspace.com');
	}
	
	// process the passed in settings to set the tasks to be completed.
	async processSettings() {
		
	}
	
	// sign in student with the portal login. 
	async studentSignIn() {
		
		this.log('SignIn', 'Starting...');
		
		// select the studen sign in button. 
		await Promise.all([
			this.page.click(StudentController.loginPortalSignIn),
			this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
		]);
		
		// enter the username and password. 
		await this.page.type(StudentController.loginPortalUserName, process.env.SCHOOLUSER);
		await this.page.type(StudentController.loginPortalPassword, process.env.SCHOOLPASS);
		
		// submit logon form.
		await Promise.all([
			this.page.click(StudentController.loginPortalSubmit),
			this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
		]);
		
		// TODO: check for failure. 
		
		this.log('SignIn', 'Completed');
		
		this.screenshot();
		
		return true;
		
	}
	
	// get the current status of the notifications. 
	async checkNotifcations()  {
		
		let grades  = await this.page.$(StudentController.gradesNotification);
		let disucssion  = await this.page.$(StudentController.disccusionNotification);
		let email  = await this.page.$(StudentController.emailNotification);
		
	}
	
	// get all the classes the student has been in.
	// THIS CURRENTLY CONTAINS DEVELOPMENT CODE. will click first class.
	async getClasses() {
		
		let courseButton = await this.page.$('.d2l-navigation-s-course-menu .d2l-dropdown-opener');
		await courseButton.click();
		
		// wait for classes to load and open.
		await this.page.waitForTimeout(1000)
		let course = await this.page.$$('.d2l-course-selector-item-name');
		
		
		// INSERT - handle common actions in here. 
		
		// select a class.
		// TODO allow for targeting of classees. 
		await Promise.all([
			course[0].click(),
			this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
		]);
		
	}
	
}
// element selector definitions. "static" assignment to the class. 
StudentController.loginPortalSignIn = '#btn-stu';
StudentController.loginPortalUserName = 'input#Username';
StudentController.loginPortalPassword = 'input#p1Input';
StudentController.loginPortalSubmit = 'button#signInButton';
StudentController.gradesNotification = '.d2l-navigation-s-notification[data-category="grades"] > d2l-dropdown > d2l-navigation-button-notification-icon';
StudentController.discussionNotification = '.d2l-navigation-s-notification[data-category="alerts"] > d2l-dropdown > d2l-navigation-button-notification-icon';
StudentController.emailNotification = '.d2l-navigation-s-notification[data-category="messages"] > d2l-dropdown > d2l-navigation-button-notification-icon';
StudentController.navCourseContainer = '.d2l-navigation-s-course-menu .d2l-dropdown-opener';
StudentController.navCourseButtons = '.d2l-course-selector-item-name';


module.exports = StudentController;