module.exports = function(grunt) {
  grunt.initConfig({
    sass: {
      dist: {
        files: {
          'dist/styles/style.css': 'sass/style.scss'
        }
      }
    },

    watch: {
      dev: {
        files: ['sass/**/*.scss','src/**/*.js'],
        tasks: ['dist'],
        options: {
          livereload: true
        }
      }
    },

    concat: {
      options: {
        separator: ';',
      },

      dependencies: {
        files: {
          'dist/js/libraries.js': [
            'bower_components/jquery/dist/jquery.min.js', 
            'bower_components/paper/dist/paper-full.min.js',
            // 'bower_components/immutable/dist/immutable.min.js'
          ] 
        }
      },

      dev: {
        files: {
          'dist/js/painter.js': [
            'src/painter.js',
            'src/history.js',
            'src/artefact.js',
            'src/actions.js',
            'src/helpers.js',
            'src/animations.js',
            'src/*.animation.js',
            'src/*.tool.js']
        }
      }
    },

    copy: {
      main: {
        expand: true,
        flatten: true,
        src: [
          'bower_components/jquery/dist/jquery.min.js', 
          'bower_components/paper/dist/paper-full.min.js'
        ],
        dest: 'dist/js/',
      },
    },

    jsdoc : {
      dist : {
        src: ['src/*.js'],
        options: {
          destination: 'docs',
          template : "node_modules/ink-docstrap/template",
          configure : "node_modules/ink-docstrap/template/jsdoc.conf.json",
          "plugins": ["plugins/markdown"],
          "markdown": {
            "tags": ["summary", "class"],
          }
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-newer')
  grunt.loadNpmTasks('grunt-jsdoc');


  grunt.registerTask('dist', ['sass', 'copy', 'concat:dev']);
  // grunt.registerTask('doc', [])
  // grunt.registerTask('dist', ['sass', 'concat:dependencies', 'concat:dev']);
};