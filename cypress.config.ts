import {defineConfig} from 'cypress';

export default defineConfig({
	fileServerFolder: './build',
	viewportWidth: 890,
	numTestsKeptInMemory: 1,
	video: false,
	screenshotOnRunFailure: false,

	e2e: {
		setupNodeEvents(on, config) {
			// implement node event listeners here
		},
	},
});
