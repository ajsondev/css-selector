var gulp = require('gulp');
var preprocess = require('gulp-preprocess');
var template = require('gulp-template');
var runSequence = require('run-sequence');
var flatten = require('gulp-flatten');
var exec = require('child_process').exec;
var standard = require('gulp-standard')
var watch = require('gulp-watch');
var zip = require('gulp-vinyl-zip');
var addsrc = require('gulp-add-src');
var babelminify = require('gulp-babel-minify');
var gulpIgnore = require('gulp-ignore');
var del = require('del');
var babel = require('gulp-babel');
var babelify = require("babelify");
var browserify = require("browserify");
var cssify = require("cssify");
var fs = require("fs");
var package = require('./package.json');
const beep = require('beepbeep');

console.log("p.version="+package.version);

// use gulp html --debug false

var minimist = require('minimist');

  var knownOptions = {
    string: ['debug','browser'],
    default: {debug:false,browser:'chrome'}
  };

var options = minimist(process.argv.slice(2), knownOptions);
console.log("Options debug :"+options.debug)

gulp.task('watch', function () {
   gulp.watch(['selector/**/*','common/**/*'], ['build-css']);
});


var config={
  dist_path: "build/",
  tasks:{
    exception:{
      name:"css",
      dir:"selector"
    }
  }
};

function makeBuildTask (task,dir) {
  var fn = function () {
    try{
      browserify('selector/sideBarBackground.js')
        .transform(cssify)
        .transform(babelify, {presets: ["es2015", "react"]})
        .bundle()
        .on('error', e =>{
          console.log("Exception1:",e)
          beep();
        })
        .pipe(fs.createWriteStream("build/selector/sideBarBackground.js"))
      gulp.src(['./'+dir+'/**/*','!./'+dir+'/README.md','!./'+dir+'/sideBarBackground.js'])
          .pipe(gulp.dest('./build/'+dir));
      return gulp.src(['./common/**/*'])
        .pipe(gulp.dest('./build/'+dir+'/common'));
    }
    catch(e){
      console.log("Exception2:",e)
      beep();
      beep();

    }
  };
  fn.displayName = "build-"+task;
  gulp.task("build-"+task, fn);
  // Or if gulp 4: gulp.task(fn);
}

function makeMiniTask (task,dir) {
  var fn = function () {
    gulp.src([dir+'/**/*.js'])
      .pipe(preprocess({context: { ENVDST: 'production'},extension:"js"}))
      .pipe(babelminify({
          ext:{
              src:'.js',
              min:'-ini.js'
          },
      }).on('error', function(e){
              console.log(e);
           }))
      .pipe(gulp.dest(config.dist_path+dir+'/'))

    gulp.src(['common/js/*.js'], {base: "."})
      .pipe(preprocess({context: { ENVDST: 'production'},extension:"js"}))
      .pipe(babelminify({
          ext:{
              src:'.js',
              min:'-ini.js'
          },
          noSource: true,
      }).on('error', function(e){
              console.log(e);
           }))
      .pipe(gulp.dest(config.dist_path+dir+'/'))

    gulp.src(['./'+dir+'/**/*','!./'+dir+'/**/*.js','!./'+dir+'/README.md','!./'+dir+'/clickbyclick_addon.sublime-project','!./'+dir+'/clickbyclick_addon.sublime-workspace'])
      .pipe(gulpIgnore.exclude(['build/'+dir+'/**/*.png','build/'+dir+'/**/*.jpg']))
      .pipe(preprocess({context: { ENVDST: 'production'},extension:"js"}))
      .pipe(addsrc(['build/'+dir+'/**/*.png','build/'+dir+'/**/*.jpg']))
      .pipe(gulp.dest(config.dist_path+dir));

    gulp.src(['./common/**/*','!./common/*/*.js'])
      .pipe(gulp.dest(config.dist_path+dir+'/common'));
  }
  fn.displayName = "mini-"+task;
  gulp.task("mini-"+task, fn);
  // Or if gulp 4: gulp.task(fn);
}

function makeDistTask (task,dir) {
  var fn = function () {
    return runSequence(
    'mini-'+task,
    'zip-'+task,
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
      }
    });
  };
  fn.displayName = "dist-"+task;
  gulp.task("dist-"+task, fn);
  // Or if gulp 4: gulp.task(fn);
}

function makeZiptask (task,dir) {
  var fn = function () {
    var manifest = require("./build/"+dir+"/"+"manifest.json")
    var archive_name = dir+"-"+manifest.version+'.zip';
    var date = new Date();
    console.log("Archive generated: "+archive_name);
    return gulp.src(['build/'+dir+'/**/*'])
      .pipe(zip.dest('./dist/'+archive_name));
  };
  fn.displayName = "zip-"+task;
  gulp.task("zip-"+task, fn);
  // Or if gulp 4: gulp.task(fn);
}


for (task in config.tasks) {
  var task_name = config.tasks[task].name;
  var dir_name = config.tasks[task].dir;
  console.log("Building: ",task_name);
  makeDistTask(task_name, dir_name);
  makeZiptask(task_name, dir_name);
  makeMiniTask(task_name, dir_name);
  makeBuildTask(task_name, dir_name);
}

//gulp.task('default', ['all']);
