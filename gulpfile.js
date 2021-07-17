const gulp = require('gulp'),
  gp = require('gulp-load-plugins')(),
  imageminJpegRecompress = require('imagemin-jpeg-recompress'),
  pngquant = require('imagemin-pngquant'),
  sass = require('gulp-sass')(require('node-sass')),
  del = require('del'),
  browserSync = require('browser-sync').create()

function activeSync(done) {
  browserSync.init({
    server: 'build/',
  })
  done()
}

function reloadBrowser(done) {
  browserSync.reload()
  done()
}

function clean() {
  return del(['build'])
}

function buildSass() {
  return gulp
    .src('sass/style.scss')
    .pipe(gp.plumber())
    .pipe(gp.sourcemaps.init())
    .pipe(sass())
    .pipe(gp.autoprefixer())
    .pipe(gp.csso())
    .pipe(gp.rename('styles.min.css'))
    .pipe(gp.sourcemaps.write(''))
    .pipe(gulp.dest('build/css'))
}

function libsCss() {
  return gulp
    .src('libs_css/**/*.css')
    .pipe(gp.plumber())
    .pipe(gp.sourcemaps.init())
    .pipe(gp.concat('all.css'))
    .pipe(gp.rename('libs.min.css'))
    .pipe(gp.sourcemaps.write(''))
    .pipe(gulp.dest('build/css'))
}

function buildScripts() {
  return gulp
    .src('js/**/*.js')
    .pipe(gp.plumber())
    .pipe(gp.sourcemaps.init())
    .pipe(gp.babel({ presets: ['@babel/preset-env'] }))
    .pipe(gp.concat('all.js'))
    .pipe(gp.uglify())
    .pipe(gp.rename('scripts.min.js'))
    .pipe(gp.sourcemaps.write(''))
    .pipe(gulp.dest('build/js'))
}

function libsJs() {
  return gulp
    .src('libs_js/**/*.js')
    .pipe(gp.plumber())
    .pipe(gp.sourcemaps.init())
    .pipe(gp.concat('all.js'))
    .pipe(gp.rename('libs.min.js'))
    .pipe(gp.sourcemaps.write(''))
    .pipe(gulp.dest('build/js'))
}

function copyFonts() {
  return gulp
    .src('fonts/**')
    .pipe(gp.rename({ dirname: '' }))
    .pipe(gulp.dest('build/fonts'))
}

function copyImages() {
  return gulp.src('img/**/*.{png,jpg,svg,webp}').pipe(gulp.dest('build/img'))
}

function copyHtml() {
  return gulp.src('*.html').pipe(gulp.dest('build'))
}

function compressImages() {
  return gulp
    .src('build/img/**/*.{png,jpg,svg,webp}')
    .pipe(
      gp.imagemin([
        gp.imagemin.mozjpeg({ progressive: true }),
        imageminJpegRecompress({
          loops: 5,
          min: 65,
          max: 70,
          quality: 'medium',
        }),
        gp.imagemin.optipng({ optimizationLevel: 3 }),
        pngquant({ quality: [0.6, 0.7], speed: 5 }),
        gp.imagemin.svgo(),
      ])
    )
    .pipe(gulp.dest('build/img'))
}

function svg() {
  return (
    gulp
      .src('build/img/**/*.svg')
      .pipe(
        gp.svgmin({
          js2svg: {
            pretty: true,
          },
        })
      )
      .pipe(
        gp.cheerio({
          run: function ($) {
            $('[fill]').removeAttr('fill')
            $('[stroke]').removeAttr('stroke')
            $('[style]').removeAttr('style')
          },
          parserOptions: { xmlMode: true },
        })
      )
      .pipe(gp.replace('&gt;', '>'))
      // build svg sprite
      .pipe(
        gp.svgSprite({
          mode: {
            symbol: {
              sprite: 'sprite.svg',
            },
          },
        })
      )
      .pipe(gulp.dest('build/img'))
  )
}

function watchChanges() {
  gulp.watch('sass/**/*', buildSass)
  gulp.watch('js/**/*', buildScripts)
  gulp.watch('libs_css/**/*', libsCss)
  gulp.watch('libs_js/**/*', libsJs)
  gulp.watch('fonts/*', copyFonts)
  gulp.watch('*.html', copyHtml)
  gulp.watch(
    'img/**/*.{png,jpg,svg,webp}',
    gulp.series(copyImages, compressImages)
  )
  gulp.watch('build/**', reloadBrowser)
}

const build = gulp.series(
  clean,
  gulp.parallel(
    libsCss,
    libsJs,
    buildSass,
    buildScripts,
    copyHtml,
    copyFonts,
    copyImages
  ),
  gulp.parallel(compressImages, svg)
)
const watch = gulp.parallel(watchChanges, activeSync)

exports.build = build
exports.watch = watch
