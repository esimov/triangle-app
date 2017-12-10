/* MIT License

Copyright (c) 2017 Endre Simó

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software
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
	blur, gray	*image.NRGBA
	sobel, srcImg 	*image.NRGBA
	triangles       []tri.Triangle
	points          []tri.Point
	lineColor       color.RGBA
)

// triangulate is the main workhorse. Transforms an image with the provided options.
func triangulate(src image.Image, opts options) image.Image {
	width, height := src.Bounds().Dx(), src.Bounds().Dy()
	ctx := gg.NewContext(width, height)
	ctx.DrawRectangle(0, 0, float64(width), float64(height))
	ctx.SetRGBA(1, 1, 1, 1)
	ctx.Fill()

	delaunay := &tri.Delaunay{}
	img := toNRGBA(src)

	start := time.Now()
	log.Print("Generating triangulated image...")

	blur = tri.Stackblur(img, uint32(width), uint32(height), uint32(opts.BlurRadius))
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

		cx := float64(p0.X+p1.X+p2.X) * 0.33333
		cy := float64(p0.Y+p1.Y+p2.Y) * 0.33333

		j := ((int(cx) | 0) + (int(cy)|0)*width) * 4
		r, g, b := srcImg.Pix[j], srcImg.Pix[j + 1], srcImg.Pix[j + 2]
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

// toNRGBA converts any image type to *image.NRGBA with min-point at (0, 0).
func toNRGBA(img image.Image) *image.NRGBA {
	srcBounds := img.Bounds()
	if srcBounds.Min.X == 0 && srcBounds.Min.Y == 0 {
		if src0, ok := img.(*image.NRGBA); ok {
			return src0
		}
	}
	srcMinX := srcBounds.Min.X
	srcMinY := srcBounds.Min.Y

	dstBounds := srcBounds.Sub(srcBounds.Min)
	dstW := dstBounds.Dx()
	dstH := dstBounds.Dy()
	dst := image.NewNRGBA(dstBounds)

	switch src := img.(type) {
	case *image.NRGBA:
		rowSize := srcBounds.Dx() * 4
		for dstY := 0; dstY < dstH; dstY++ {
			di := dst.PixOffset(0, dstY)
			si := src.PixOffset(srcMinX, srcMinY+dstY)
			for dstX := 0; dstX < dstW; dstX++ {
				copy(dst.Pix[di:di+rowSize], src.Pix[si:si+rowSize])
			}
		}
	case *image.YCbCr:
		for dstY := 0; dstY < dstH; dstY++ {
			di := dst.PixOffset(0, dstY)
			for dstX := 0; dstX < dstW; dstX++ {
				srcX := srcMinX + dstX
				srcY := srcMinY + dstY
				siy := src.YOffset(srcX, srcY)
				sic := src.COffset(srcX, srcY)
				r, g, b := color.YCbCrToRGB(src.Y[siy], src.Cb[sic], src.Cr[sic])
				dst.Pix[di+0] = r
				dst.Pix[di+1] = g
				dst.Pix[di+2] = b
				dst.Pix[di+3] = 0xff
				di += 4
			}
		}
	case *image.Gray:
		for dstY := 0; dstY < dstH; dstY++ {
			di := dst.PixOffset(0, dstY)
			si := src.PixOffset(srcMinX, srcMinY+dstY)
			for dstX := 0; dstX < dstW; dstX++ {
				c := src.Pix[si]
				dst.Pix[di+0] = c
				dst.Pix[di+1] = c
				dst.Pix[di+2] = c
				dst.Pix[di+3] = 0xff
				di += 4
				si += 2
			}
		}
	default:
		for dstY := 0; dstY < dstH; dstY++ {
			di := dst.PixOffset(0, dstY)
			for dstX := 0; dstX < dstW; dstX++ {
				c := color.NRGBAModel.Convert(img.At(srcMinX+dstX, srcMinY+dstY)).(color.NRGBA)
				dst.Pix[di+0] = c.R
				dst.Pix[di+1] = c.G
				dst.Pix[di+2] = c.B
				dst.Pix[di+3] = c.A
				di += 4
			}
		}
	}

	return dst
}
