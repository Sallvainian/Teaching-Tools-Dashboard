import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
	plugins: [
		tailwindcss,
		autoprefixer({
			// Use modern browser support based on browserslist
			overrideBrowserslist: [
				'defaults',
				'not IE 11',
				'not IE_Mob 11',
				'not op_mini all',
				'last 2 versions',
				'> 1%'
			]
		})
	]
};
