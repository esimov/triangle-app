# ![Triangle logo](https://user-images.githubusercontent.com/883386/32769128-4d9625c6-c923-11e7-9a96-030f2f0efff3.png)

[![Build Status](https://travis-ci.org/esimov/triangle-app.svg?branch=master)](https://travis-ci.org/esimov/triangle-app)

Triangle is a desktop application for https://github.com/esimov/triangle built on top of `electron`. It communicates with a backend server written in Go. For this reason you have to make sure Go is installed on your local environment.

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
In case you do not want to build the application yourself you can jump straight to the [release](https://github.com/esimov/triangle-app/releases) page and download the executable file. **Windows**, **MacOS** and **Ubuntu** are supported. Otherwise, you can build the application yourself. 

#### Install

```bash
$ git clone https://github.com/esimov/triangle-app
$ yarn install
```
> Note: the app was compiled, bundled and build using node.js v8.9.1. It's strongly recommend to use `yarn` instead of `npm` (I got some strange issues during the build process using `npm`).

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
* To run the electron application:
```bash
$ yarn run dev
```
* To bundle the application with webpack:
```bash
$ yarn run build
```
> Note: this is required in case you wish to start the electron application with `$ electron` command.

* To build the binary files:
```bash
$ yarn run dist
```
This command generates the binary files depending on the current operating system.

#### Runing the web server
Open a new terminal and select the `server` folder from the application root directory then type:

```bash
$ go run server.go triangle.go
```

#### Examples

<a href="https://github.com/esimov/triangle/blob/master/output/sample_3.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_3.png" width=418/></a>
<a href="https://github.com/esimov/triangle/blob/master/output/sample_4.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_4.png" width=418/></a>
<a href="https://github.com/esimov/triangle/blob/master/output/sample_5.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_5.png" width=418/></a>
<a href="https://github.com/esimov/triangle/blob/master/output/sample_6.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_6.png" width=418/></a>

## License

This project is under the Apache License 2.0. See the [LICENSE](https://github.com/esimov/triangle-app/blob/master/LICENSE) file for the full license text. 
