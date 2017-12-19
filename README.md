# ![Triangle logo](https://user-images.githubusercontent.com/883386/32769128-4d9625c6-c923-11e7-9a96-030f2f0efff3.png)
Desktop application for [Triangle](https://github.com/esimov/triangle).  

[![Build Status](https://travis-ci.org/esimov/triangle-app.svg?branch=master)](https://travis-ci.org/esimov/triangle-app)

Triangle is a desktop application built on top of `electron` communicating with a backend image server. For this reason you have to make sure Go is installed. Then set your `GOPATH`, and make sure `$GOPATH/bin` is on your `PATH`.

<p align="center">
<img src="https://user-images.githubusercontent.com/883386/34100521-59d39458-e3eb-11e7-8ee5-21b1da7784da.gif"/>
</p>

### Install Go

```bash
$ export GOPATH="$HOME/go"
$ export PATH="$PATH:$GOPATH/bin"
```

Then run the backend service.

```bash
$ go get github.com/esimov/triangle/
```

A less cumbersome and more straightforward solution would be to have the image server installed on a remote host and communicate with via `http`. In a future release I will consider to use a free Go host provider or *if someone is willing to donate a cloud space, hosting Go*, I would be very thankful.

### Install & build the application
If you do not want to build the application yourself you can jump straight to the [release](https://github.com/esimov/triangle-app/releases) page and download the distribution you wish. The three main OS are supported: **Windows**, **MacOS** and **Ubuntu**. Otherwise, you can build the application yourself. Follow along.

#### Install

```bash
$ git clone https://github.com/esimov/triangle-app
$ yarn install
```
> Note: the app was compiled, bundled and build using node.js v8.9.1. I got some issues running with node v6.x.

I strongly recommend to use `yarn` instead of `npm` (i got some really strange issues trying to build the application using `npm`).

The following `run` commands are supported:

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
After the installation was done, open the terminal window and start the image server by selecting the folder where the Go project was installed and run:

```bash
$ go run server.go triangle.go
```

#### Examples

<img align="left" src="https://user-images.githubusercontent.com/883386/34115187-86aeee5a-e41d-11e7-80d1-68d107c4bb58.jpg" width=420 />
<img src="https://user-images.githubusercontent.com/883386/34116133-5060e63e-e420-11e7-8d2c-d5823af90bf5.jpg" width=420 />

## License

This project is under the Apache License 2.0. See the [LICENSE](https://github.com/esimov/triangle-app/blob/master/LICENSE) file for the full license text. 

Apache 2.0 © [Endre Simo](https://github.com/esimov)
