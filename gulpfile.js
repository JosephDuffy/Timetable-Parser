var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var postcss = require('gulp-postcss');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('autoprefixer');

gulp.task('sass', function() {
  gulp.src('./public/css/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('sass:watch', function() {
  gulp.watch('./public/css/**/*.scss', ['sass']);
});

gulp.task('minify-css', function() {
  return gulp.src('./public/css/**/*[!min].css')
    .pipe(sourcemaps.init())
    .pipe(minifyCSS({compatibility: 'ie8'}))
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('minify-css:watch', function() {
  gulp.watch('./public/css/**/*[!min].css', ['minify-css']);
});

gulp.task('watchers', ['sass:watch', 'minify-css:watch']);

gulp.task('default', ['sass', 'minify-css']);