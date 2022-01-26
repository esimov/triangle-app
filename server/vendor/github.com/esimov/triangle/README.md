
# ![Triangle logo](https://user-images.githubusercontent.com/883386/32769128-4d9625c6-c923-11e7-9a96-030f2f0efff3.png)

[![Build Status](https://travis-ci.org/esimov/triangle.svg?branch=master)](https://travis-ci.org/esimov/triangle)
[![GoDoc](https://godoc.org/github.com/golang/gddo?status.svg)](https://godoc.org/github.com/esimov/triangle)
[![license](https://img.shields.io/github/license/esimov/triangle)](./LICENSE)
[![release](https://img.shields.io/badge/release-v1.2.2-blue.svg)](https://github.com/esimov/triangle/releases/tag/v1.2.2)
![homebrew](https://img.shields.io/badge/homebrew-v1.2.2-orange.svg)

**▲ Triangle** is a tool for generating triangulated image using [delaunay triangulation](https://en.wikipedia.org/wiki/Delaunay_triangulation). It takes a source image and converts it to an abstract image composed of tiles of triangles.

![Sample image](https://github.com/esimov/triangle/blob/master/output/sample_3.png)

### The process
* First the image is blured out to smothen sharp pixel edges. The more blured an image is the more diffused the generated output will be.
* Second the resulted image is converted to grayscale mode.
* Then a [sobel](https://en.wikipedia.org/wiki/Sobel_operator) filter operator is applied on the grayscaled image to obtain the image edges. An optional threshold value is applied to filter out the representative pixels of the resulted image.
* Lastly the delaunay algorithm is applied on the pixels obtained from the previous step.

```go
blur = tri.Stackblur(img, uint32(width), uint32(height), uint32(*blurRadius))
gray = tri.Grayscale(blur)
sobel = tri.SobelFilter(gray, float64(*sobelThreshold))
points = tri.GetEdgePoints(sobel, *pointsThreshold, *maxPoints)

triangles = delaunay.Init(width, height).Insert(points).GetTriangles()
```

### Features

- [x] Can process recursively whole directories and subdirectories concurrently.
- [x] Supports various image types.
- [x] There is no need to specify the file type, the CLI tool can recognize automatically the input and output file type.
- [x] Can accept image URL as parameter for the `-in` flag.
- [x] Possibility to save the generated image as an **SVG** file.
- [x] The generated SVG file can be accessed from the Web browser directly.
- [x] Clean and intuitive API. The API not only that accepts image files but can also work with image data. This means that the [`Draw`](https://github.com/esimov/triangle/blob/65672f53a60a6a35f5e85bed69e46e97fe2d2def/process.go#L82) method can be invoked even on data streams. Check this [demo](https://github.com/esimov/pigo-wasm-demos#face-triangulator) for reference.
- [x] Support for pipe commands (possibility to pipe in and pipe out the source and destination image).

Head over to this [subtopic](#key-features) to get a better understanding of the supported features.

## Installation and usage
```bash
$ go get -u -f github.com/esimov/triangle/cmd/triangle
$ go install
```
You can also download the binary file from the [releases](https://github.com/esimov/triangle/releases) folder.

## MacOS (Brew) install
The library can be installed via Homebrew too.

```bash
$ brew install triangle
```

## Supported commands

```bash
$ triangle --help
```
The following flags are supported:

| Flag | Default | Description |
| --- | --- | --- |
| `in` | n/a | Source image |
| `out` | n/a | Destination image |
| `blur` | 4 | Blur radius |
| `pts` | 2500 | Maximum number of points |
| `noise` | 0 | Noise factor |
| `th` | 20 | Points threshold |
| `sobel` | 10 | Sobel filter threshold |
| `solid` | false | Use solid stroke color (yes/no) |
| `wf` | 0 | Wireframe mode (0: without stroke, 1: with stroke, 2: stroke only) |
| `stroke` | 1 | Stroke width |
| `gray` | false | Output in grayscale mode |
| `web` | false | Open the SVG file in the web browser |
| `bg` | ' ' | Background color (specified as hex value) |
| `c` | system spec. | Number of files to process concurrently (workers)

## Key features

#### Process multiple images from a directory concurrently
The CLI tool also let you process multiple images from a directory **concurrently**. You only need to provide the source and the destination folder by using the `-in` and `-out` flags.

```bash
$ triangle -in <input_folder> -out <output-folder>
```

#### Pipe commands
The CLI tool accepts also pipe commands, which means you can use `stdin` and `stdout` without providing a value for the `-in` and `-out` flag directly since these defaults to `-`. For this reason is possible to use `curl` for example to get an image from the net and invoke the triangulation process over it directly without the need to download the image first and call **▲ Triangle** afterwards.

Here are some examples using pipe names:
```bash
$ curl <image_url> | triangle > out.jpg
$ cat input/source.jpg | triangle > out.jpg
$ triangle -in input/source.jpg > out.jpg
$ cat input/source.jpg | triangle -out out.jpg
$ triangle -out out.jpg < input/source.jpg
```

#### Background color
You can specify a background color in case of transparent background images (`.png`) by using the `-bg` flag. This flag accepts a hexadecimal string value. For example setting the flag to `-bg=#ffffff00` will set the alpha channel of the resulted image transparent.

#### Output as image or SVG
By default the output is saved to an image file, but you can export the resulted vertices even to an SVG file. The CLI tool can recognize the output type directly from the file extension. This is a handy addition for those who wish to generate large images without guality loss.

```bash
$ triangle -in samples/input.jpg -out output.svg
```

Using with `-web` flag you can access the generated svg file directly on the web browser.

```bash
$ triangle -in samples/input.jpg -out output.svg -web=true
```

#### Supported output types
The following output file types are supported: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.svg`.

### Tweaks
Setting a lower points threshold, the resulted image will be more like a cubic painting. You can even add a noise factor, generating a more artistic, grainy image.

Here are some examples you can experiment with:
```bash
$ triangle -in samples/input.jpg -out output.png -wf=0 -pts=3500 -stroke=2 -blur=2
$ triangle -in samples/input.jpg -out output.png -wf=2 -pts=5500 -stroke=1 -blur=10
```

## Examples

<a href="https://github.com/esimov/triangle/blob/master/output/sample_3.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_3.png" width=410/></a>
<a href="https://github.com/esimov/triangle/blob/master/output/sample_4.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_4.png" width=410/></a>
<a href="https://github.com/esimov/triangle/blob/master/output/sample_5.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_5.png" width=410/></a>
<a href="https://github.com/esimov/triangle/blob/master/output/sample_6.png"><img src="https://github.com/esimov/triangle/blob/master/output/sample_6.png" width=410/></a>
![Sample_0](https://github.com/esimov/triangle/blob/master/output/sample_0.png)
![Sample_1](https://github.com/esimov/triangle/blob/master/output/sample_1.png)
![Sample_11](https://github.com/esimov/triangle/blob/master/output/sample_11.png)
![Sample_8](https://github.com/esimov/triangle/blob/master/output/sample_8.png)


## License
Copyright © 2018 Endre Simo

This project is under the MIT License. See the [LICENSE](https://github.com/esimov/triangle/blob/master/LICENSE) file for the full license text.
