var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var mocha = require("gulp-mocha");
var istanbul = require("gulp-istanbul");

var PATH_TO_SRC = "jquery.liteuploader.js";
var MINIFIED_FILE_NAME = "jquery.liteuploader.min.js";

gulp.task("default", ["watch", "tests"]);

gulp.task("watch", function () {
  gulp.watch(["test/*.js", PATH_TO_SRC], ["minify", "tests"]);
});

gulp.task("minify", function() {
  return gulp.src(PATH_TO_SRC)
    .pipe(uglify({preserveComments: "license"}))
    .pipe(rename(MINIFIED_FILE_NAME))
    .pipe(gulp.dest("./"));
});

gulp.task("coverage", function () {
  return gulp.src(PATH_TO_SRC)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task("tests", ["coverage"], function () {
  return gulp.src(["test/*.js"])
    .pipe(mocha())
    .pipe(istanbul.writeReports())
    .on("finish", function () {
      console.log("Breakdown: file://" + __dirname + "/coverage/index.html");
    });
});
