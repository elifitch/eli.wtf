'use strict'

const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const gutil = require('gulp-util')
const del = require('del')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')
const sass = require('gulp-sass')
const stylelint = require('gulp-stylelint')
const sourcemaps = require('gulp-sourcemaps')
const nunjucks = require('gulp-nunjucks')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const browserify = require('browserify')
const envify = require('loose-envify/custom')
const rev = require('gulp-rev')
const revReplace = require('gulp-rev-replace')
const uglify = require('gulp-uglify')
const cleancss = require('gulp-clean-css')
const htmlmin = require('gulp-htmlmin')
const gulpif = require('gulp-if')
const plumber = require('gulp-plumber')
const critical = require('critical').stream
const runSequence = require('run-sequence')
const config = require('./config').get()
const prettyUrl = require('gulp-pretty-url');
const browserslist = 'last 2 versions, Firefox ESR'  // see https://github.com/ai/browserslist#queries
const extrasGlob = 'src/**/*.{txt,json,xml,ico,jpeg,jpg,png,gif,svg,ttf,otf,eot,woff,woff2}'

let bundler = browserify({ entry: true, debug: true })
  .add('src/js/app.js')
  .transform('eslintify', { continuous: true })
  .transform('babelify')
  .transform(envify(config))
  .transform('uglifyify')

function bundle() {
  return bundler.bundle()
  .on('error', function(err) {
    gutil.log(gutil.colors.red(err.message))
    this.emit('end')
  })
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('public/js/'))
}


gulp.task('browserify', () => {
  return bundle()
})

gulp.task('watchify', () => {
  gutil.log('watching')
  const watchify = require('watchify')
  bundler = watchify(bundler)
  bundler.on('update', () => {
    gutil.log('-> bundling...')
    bundle()
  })
  return bundle()
})

gulp.task('sass', () => {
  return gulp.src('src/scss/**/*.scss')
    .pipe(plumber())
    // .pipe(stylelint({
    //   browsers: browserslist,
    //   syntax: 'scss',
    //   reporters: [ { formatter: 'string', console: true } ],
    //   failAfterError: false
    // }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: [path.join(path.dirname(require.resolve('foundation-sites')), '../scss')]
    }))
    .pipe(postcss([autoprefixer({ browsers: browserslist })]))
    .pipe(sourcemaps.write())
    .pipe(plumber.stop())
    .pipe(gulp.dest('public/css/'))
})

gulp.task('nunjucks', () => {
  return gulp.src(['src/templates/**/*.html', '!**/_*'])
    .pipe(plumber())
    .pipe(nunjucks.compile(config, {
      throwOnUndefined: true
    }))
    .pipe(prettyUrl())
    .pipe(plumber.stop())
    .pipe(gulp.dest('public/'))
})

gulp.task('extras', () => {
  return gulp.src(extrasGlob)
    .pipe(gulp.dest('public/'))
})

gulp.task('watch', ['watchify'], () => {
  const browserSync = require('browser-sync').create()
  browserSync.init({
    server: 'public',
    files: 'public/**/*'
  })

  gulp.watch('src/scss/**/*.scss', ['sass'])
  gulp.watch('src/**/*.html', ['nunjucks'])
  gulp.watch('src/js/**/*.js', ['browserify'])
  gulp.watch(extrasGlob, ['extras'])
})

gulp.task('rev', () => {
  return gulp.src(['public/**/*', '!**/*.html'], { base: 'public' })
    .pipe(rev())
    .pipe(gulp.dest('public/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('public/'))
})

gulp.task('rev:replace', ['rev'], () => {
  const manifest = gulp.src('public/rev-manifest.json')
  return gulp.src('public/**/*')
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest('public/'))
})

gulp.task('minify', ['rev:replace', 'critical'], () => {
  return gulp.src(['public/**/*'], { base: 'public/' })
    // Only target the versioned files with the hash
    // Those files have a - and a 10 character string
    .pipe(gulpif(/-\w{10}\.js$/, uglify({
      preserveComments: 'license',
      compressor: {
        screw_ie8: true
      },
      output: {
        preamble: (function() {
          var banner = fs.readFileSync('banner.txt', 'utf8')
          banner = banner.replace('@date', (new Date()))
          return banner
        }())
      }
    })))
    .pipe(gulpif(/-\w{10}\.css$/, cleancss()))
    .pipe(gulpif('*.html', htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('public/'))
})

gulp.task('critical', ['rev:replace'], function() {
  return gulp.src('public/**/*.html')
  .pipe(critical({
    base: 'public/',
    inline: true,
    minify: true
  }))
  .pipe(gulp.dest('public/'))
})

gulp.task('clean', () => {
  return del('public/')
})

gulp.task('build', (done) => {
  runSequence(
    'clean',
    ['browserify', 'nunjucks', 'sass', 'extras'],
    done
  )
})

gulp.task('build:production', (done) => {
  runSequence(
    'build',
    ['rev:replace', 'minify', 'critical'],
    done
  )
})

gulp.task('start', (done) => {
  runSequence(
    'build',
    'watch',
    done
  )
})

gulp.task('default', ['build'])
