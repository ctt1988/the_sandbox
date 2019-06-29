'use strict';

var gulp = require('gulp');
var minifyCss = require('gulp-minify-css');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var ngAnnotate = require('gulp-ng-annotate');
var angularTemplates = require('gulp-angular-templates');
var uglify = require('gulp-uglify');
var compass = require('gulp-compass');
var rename = require('gulp-rename');
var bump = require('gulp-bump');
var del = require('del');
var runSequence = require('run-sequence');

//Need to modify the /routes/index.js as well
var cahceVersion;

var outputPath = './app/public/dist';

/** Main task **/
gulp.task('dist', ['cache:bump'], function(done) {
    //get latest cache version
    cahceVersion = require('./app/cacheversion')();
    runSequence('dist:clean', 'css:min', 'app:main', 'app:join', function() {
        del.sync([
              'app/public/dist/fontawesome',
              'app/public/dist/styles.css',
              'app/public/dist/services' + cahceVersion + '.js',
              'app/public/dist/template' + cahceVersion + '.js',
              'app/public/dist/directives' + cahceVersion + '.js',
              'app/public/dist/controller' + cahceVersion + '.js',
              'app/public/dist/app' + cahceVersion + '.js'
        ]);
        done();
    });
});

/** Join All application resources **/
gulp.task('app:join', function(){
  return gulp.src([
      'app/public/dist/services' + cahceVersion + '.js',
      'app/public/dist/template' + cahceVersion + '.js',
      'app/public/dist/directives' + cahceVersion + '.js',
      'app/public/dist/controller' + cahceVersion + '.js',
      'app/public/dist/app' + cahceVersion + '.js',
  ])
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('synsormed.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Dev task **/
gulp.task('dev', function(done) {
    //get latest cache version
    cahceVersion = require('./app/cacheversion')();
    runSequence('css:min', function() {
        del.sync([
              'app/public/dist/fontawesome',
              'app/public/dist/styles.css'
        ]);
        done();
    });
});


/** Automatic upgrade the sema-version for breaking cache **/
gulp.task('cache:bump', function(){
    return gulp.src('./package.json')
      .pipe(bump({key: "cacheVersion", type: 'patch'}))
      .pipe(gulp.dest('./'));
});

/** Clean the dist folder **/
gulp.task('dist:clean', function(){
    return del.sync([
        'app/public/dist/**/*'
  ]);
});

/** Compile SASS and external libs to css **/
gulp.task('css:gen', function(){
  return gulp.src('./app/public/sass/style.scss')
  .pipe(compass({
      config_file: './app/config.rb',
      sass: './app/public/sass',
      css: outputPath,
      font: './app/public/fonts'
    }))
  .pipe(concatCss('style.css'))
  .pipe(gulp.dest(outputPath));

});

/** Minfiy compiled Css **/
gulp.task('css:min', ['css:gen'], function(){
  return gulp.src([
        './app/public/dist/styles.css'
    ])
  .pipe(minifyCss({compatibility: 'ie10'}))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Complie all external vendor files like JQuery, Bootstrap **/
gulp.task('vendor:main', function(){
  return gulp.src([
    'app/public/javascripts/libs/javascripts/jquery.min.js',
    'app/public/javascripts/libs/javascripts/bootstrap.js',
    'app/public/javascripts/libs/javascripts/lodash.js',
    'app/public/javascripts/libs/javascripts/autofill-event.js',
    'app/public/javascripts/libs/javascripts/moment.min.js',
    'app/public/javascripts/libs/javascripts/bootstrap-tagsinput/bootstrap-tagsinput.js',
    'app/public/javascripts/libs/javascripts/highcharts/highcharts.js',
    'app/public/javascripts/libs/javascripts/highcharts/exporting.js',
    'app/public/javascripts/libs/javascripts/highcharts/offline-exporting.js',
    'app/public/javascripts/libs/javascripts/jspdf.min.js',
    'app/public/javascripts/libs/javascripts/html2canvas.min.js',
    'app/public/javascripts/libs/javascripts/quickblox.min.js',
    'app/public/javascripts/libs/javascripts/socket.io.js'
  ])
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('vendor.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Angular modules and angular vendor files **/
gulp.task('vendor:angular', ['vendor:main'], function(){
  return gulp.src([
    'app/public/javascripts/libs/angular/angular/angular.js',
    'app/public/javascripts/libs/angular/angular-route/angular-route.js',
    'app/public/javascripts/libs/angular/angular-ui/angular-ui-switch.min.js',
    'app/public/javascripts/libs/angular/angular-animate/angular-animate.js',
    'app/public/javascripts/libs/angular/angular-local-storage/angular-local-storage.js',
    'app/public/javascripts/libs/angular/angular-rangeSlider/angular.rangeSlider.js',
    'app/public/javascripts/libs/angular/angular-ui/ui-bootstrap.js',
    'app/public/javascripts/libs/angular/angular-ng-options/options.js',
    'app/public/javascripts/libs/angular/angular-ui/ui-bootstrap-tpls.js',
    'app/public/javascripts/libs/angular/datetimepicker/datetimepicker.js',
    'app/public/javascripts/libs/angular/angular-highcharts/highcharts-ng.js',
    'app/public/javascripts/libs/angular/spin/spin.js',
    'app/public/javascripts/libs/angular/templates.js',
    'app/public/javascripts/libs/angular/angular-ui-mask/mask.js',
    'app/public/javascripts/libs/angular/combo-datepicker/ngComboDatePicker.js',
    'app/public/javascripts/libs/angular/angular-ng-map/ng-map.js',
    'app/public/javascripts/libs/angular/angular-socket-io/socket.js',
    'app/public/javascripts/libs/angular/angular-sanitize/angular-sanitize.js',
    'app/public/javascripts/libs/angular/angular-ui-select/select.min.js',
    'app/public/javascripts/libs/javascripts/multiple-select/multiple-select.min.js'
]).pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('angular-vendor.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Compile all application services **/
gulp.task('app:service', ['vendor:angular'], function(){
  return gulp.src('app/public/javascripts/app/services/**/*.js')
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('services.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** compile all directives **/
gulp.task('app:directive', ['app:service'], function(){
  return gulp.src([
      'app/public/javascripts/app/directives/**/*.js',
      'app/public/javascripts/app/components/**/*.js'
  ])
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('directives.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Compile all controllers **/
gulp.task('app:controller', ['app:directive'], function(){
  return gulp.src('app/public/javascripts/app/features/**/*.js')
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('controller.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Application Templates **/
gulp.task('app:template', ['app:controller'], function(){
  return gulp.src(['app/public/javascripts/app/**/*.html'])
  .pipe(angularTemplates({
      basePath: 'javascripts/app/',
      standalone: false,
      module: 'templates'}))
  .pipe(concat('template.js'))
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});

/** Main Application File **/
gulp.task('app:main', ['app:template'], function(){

  return gulp.src('app/public/javascripts/app/app.js')
  .pipe(ngAnnotate())
  .pipe(uglify())
  .pipe(concat('app.js'))
  .pipe(rename({ suffix: cahceVersion }))
  .pipe(gulp.dest(outputPath));
});


