module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            dist: {
                files: {
                    'public/js/immodispo.min.js': ['client/app/**/*.js']
                }
            }
        },

        watch: {
            scripts: {
                files: ['client/app/**/*.js'],
                tasks: ['browserify']
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ['browserify']);

    //Browserify
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

};
