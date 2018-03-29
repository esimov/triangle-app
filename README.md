# ![Triangle logo](https://user-images.githubusercontent.com/883386/32769128-4d9625c6-c923-11e7-9a96-030f2f0efff3.png)

[![Build Status](https://travis-ci.org/esimov/triangle-app.svg?branch=master)](https://travis-ci.org/esimov/triangle-app)

Triangle is a desktop application built on top of `electron` communicating with a backend server written in Go. For this reason you have to make sure Go is installed.

<p align="center">
<img src="https://user-images.githubusercontent.com/883386/34100521-59d39458-e3eb-11e7-8ee5-21b1da7784da.gif"/>
</p>

### Install Go

After instalation set your `GOPATH`, and make sure `$GOPATH/bin` is on your `PATH`.

```bash
$ export GOPATH="$HOME/go"
$ export PATH="$PATH:$GOPATH/bin"
```

### Install & build the application
In case you do not want to build the application yourself you can jump straight to the [release](https://github.com/esimov/triangle-app/releases) page and download the binary file. **Windows**, **MacOS** and **Ubuntu** are supported. Otherwise, you can build the application yourself. 

#### Install

```bash
$ git clone https://github.com/esimov/triangle-app
$ yarn install
```
> Note: the app was compiled, bundled and build using node.js v8.9.1. I got some issues running with node v6.x.

I strongly recommend to use `yarn` instead of `npm` (i got some strange issues during the build process when i used `npm`).

The following commands are supported:

```bash
$ yarn run
- build
  react-scripts build
- dev
  nf start -p 3000
- dist
  yarn run build && electron-builder
- eject
  react-scripts eject
- electron
  electron .
- make
  electron-forge make
- pack
  electron-builder --dir
- package
  electron-forge package
- publish
  electron-forge publish
- start
  react-scripts start
```
#### Usage:
* To run the electron application use:
```bash
$ yarn run dev
```
* To bundle the application with webpack use:
```bash
$ yarn run build
```
> Note: this is required in case you wish to start the electron application with `$ electron` command.

* To build the binary files use:
```bash
$ yarn run dist
```
This will generate the binary files depending on the platform under the command is executed.

#### Runing
Open terminal window and start the image server by selecting the folder where the Go project was installed and run:

```bash
$ go run server.go triangle.go
```

#### Examples

<img align="left" src="https://user-images.githubusercontent.com/883386/34115187-86aeee5a-e41d-11e7-80d1-68d107c4bb58.jpg" width=420 />
<img src="https://user-images.githubusercontent.com/883386/34116133-5060e63e-e420-11e7-8d2c-d5823af90bf5.jpg" width=420 />

## License

This project is under the Apache License 2.0. See the [LICENSE](https://github.com/esimov/triangle-app/blob/master/LICENSE) file for the full license text. 

Apache 2.0 © [Endre Simo](https://github.com/esimov)
