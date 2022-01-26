/*
* Copyright (c) 2017 Endre Simo
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at

*   http://www.apache.org/licenses/LICENSE-2.0

* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

package main

import (
	"image"
	"image/color"
	"log"
	"time"

	tri "github.com/esimov/triangle"
	"github.com/fogleman/gg"
)

const (
	WITHOUT_WIREFRAME = iota
	WITH_WIREFRAME
	WIREFRAME_ONLY
)

var (
	blur, gray    *image.NRGBA
	sobel, srcImg *image.NRGBA
	triangles     []tri.Triangle
	points        []tri.Point
	lineColor     color.RGBA
)

// triangulate is the main workhorse. Transforms an image with the provided options.
func triangulate(src image.Image, opts options) image.Image {
	width, height := src.Bounds().Dx(), src.Bounds().Dy()
	ctx := gg.NewContext(width, height)
	ctx.DrawRectangle(0, 0, float64(width), float64(height))
	ctx.SetRGBA(1, 1, 1, 1)
	ctx.Fill()

	delaunay := &tri.Delaunay{}
	img := tri.ToNRGBA(src)

	start := time.Now()
	log.Print("Generating triangulated image...")

	blur = tri.StackBlur(img, uint32(opts.BlurRadius))
	gray = tri.Grayscale(blur)
	sobel = tri.SobelFilter(gray, float64(opts.SobelThreshold))
	points = tri.GetEdgePoints(sobel, opts.PointsThreshold, opts.MaxPoints)

	triangles = delaunay.Init(width, height).Insert(points).GetTriangles()

	if opts.Grayscale {
		srcImg = gray
	} else {
		srcImg = img
	}

	for i := 0; i < len(triangles); i++ {
		t := triangles[i]
		p0, p1, p2 := t.Nodes[0], t.Nodes[1], t.Nodes[2]

		ctx.Push()
		ctx.MoveTo(float64(p0.X), float64(p0.Y))
		ctx.LineTo(float64(p1.X), float64(p1.Y))
		ctx.LineTo(float64(p2.X), float64(p2.Y))
		ctx.LineTo(float64(p0.X), float64(p0.Y))

		cx := float64(p0.X+p1.X+p2.X) * opts.CoordCenter
		cy := float64(p0.Y+p1.Y+p2.Y) * opts.CoordCenter

		j := ((int(cx) | 0) + (int(cy)|0)*width) * 4
		r, g, b := srcImg.Pix[j], srcImg.Pix[j+1], srcImg.Pix[j+2]
		wfcol := opts.WireframeColor

		if opts.SolidWireframe {
			lineColor = color.RGBA{R: wfcol.R, G: wfcol.G, B: wfcol.B, A: 255}
		} else {
			lineColor = color.RGBA{R: r, G: g, B: b, A: 255}
		}

		switch opts.WireframeType {
		case WITHOUT_WIREFRAME:
			ctx.SetFillStyle(gg.NewSolidPattern(color.RGBA{R: r, G: g, B: b, A: 255}))
			ctx.FillPreserve()
			ctx.Fill()
		case WITH_WIREFRAME:
			ctx.SetFillStyle(gg.NewSolidPattern(color.RGBA{R: r, G: g, B: b, A: 255}))
			ctx.SetStrokeStyle(gg.NewSolidPattern(lineColor))
			ctx.SetLineWidth(opts.StrokeWidth * 0.1)
			ctx.FillPreserve()
			ctx.StrokePreserve()
			ctx.Stroke()
		case WIREFRAME_ONLY:
			ctx.SetStrokeStyle(gg.NewSolidPattern(lineColor))
			ctx.SetLineWidth(opts.StrokeWidth * 0.1)
			ctx.StrokePreserve()
			ctx.Stroke()
		}
		ctx.Pop()
	}

	var finalImg image.Image
	newimg := ctx.Image()
	// Apply a noise on the final image. This will give it a more artistic look.
	if opts.Noise > 0 {
		finalImg = tri.Noise(opts.Noise, newimg, newimg.Bounds().Dx(), newimg.Bounds().Dy())
	} else {
		finalImg = newimg
	}

	end := time.Since(start)
	log.Printf("Generated in: \x1b[92m%.2fs\n", end.Seconds())
	log.Printf("\x1b[39mTotal number of \x1b[92m%d \x1b[39mtriangles generated out of \x1b[92m%d \x1b[39mpoints\n", len(triangles), len(points))

	return finalImg
}
