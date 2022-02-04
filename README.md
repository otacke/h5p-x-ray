# H5P X-Ray
Add an x-ray effect to images.

## Getting started
It's not enough to just download this code as a zip file and copy it somewhere.
You will need to build the distribution files first and then pack them with
the [H5P CLI Tool](https://h5p.org/h5p-cli-guide).

Clone this repository with git and check out the branch that you are interested
in (or choose the branch first and then download the archive, but learning
how to use git really makes sense).

Change to the repository directory and run
```bash
npm install
```

to install required modules. Afterwards, you can build the project using
```bash
npm run build
```

or, if you want to let everything be built continuously while you are making
changes to the code, run
```bash
npm run watch
```
Before putting the code in production, you should always run `npm run build`.

The build process will transpile ES6 to earlier versions in order to improve
compatibility to older browsers. If you want to use particular functions that
some browsers don't support, you'll have to add a polyfill.

The build process will also move the source files into one distribution file and
minify the code.

Change to the repositories parent directory and run
```bash
h5p pack h5p-x-ray ~/H5P.XRay.h5p
```

in order to pack files into an H5P library file in your home directory. Please note that you will have to make sure to install H5P libraries that this content type may depend on yourself.
