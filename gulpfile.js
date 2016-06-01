var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var mocha = require("gulp-mocha");
var istanbul = require("gulp-istanbul");

var PATH_TO_SRC = "liteuploader.js";
var MINIFIED_FILE_NAME = "liteuploader.min.js";

function handleError () {
  this.emit("end");
}

gulp.task("default", ["watch", "tests"]);

gulp.task("watch", function () {
  gulp.watch(["test/*.js", PATH_TO_SRC], ["minify", "tests"]);
});

gulp.task("minify", function () {
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
    .on("error", handleError)
    .pipe(istanbul.writeReports())
    .on("finish", function () {
      console.log("Breakdown: file://" + __dirname + "/coverage/lcov-report/index.html");
    });
});
