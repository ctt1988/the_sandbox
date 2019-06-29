module.exports = function(grunt) {
    var config = {
        devserver: {
            server: {
                options: {
                    port: 8890,
                    base: './www'
                }
            }
        }
    };
    grunt.initConfig(config)
    grunt.loadNpmTasks('grunt-devserver');
}