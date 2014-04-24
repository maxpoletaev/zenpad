var gulp = require('gulp');
var jscs = require('gulp-jscs');

gulp.task('default', function () {
  return gulp.src('lib/**/*.js')
    .pipe(jscs());
});
