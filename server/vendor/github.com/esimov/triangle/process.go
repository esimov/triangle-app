package triangle

import (
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"io"
	"os"
	"path/filepath"
	"text/template"

	"github.com/fogleman/gg"
	"golang.org/x/image/bmp"
)

const (
	// WithoutWireframe - generates triangles without stroke
	WithoutWireframe = iota
	// WithWireframe - generates triangles with stroke
	WithWireframe
	// WireframeOnly - generates triangles only with wireframe
	WireframeOnly
)

// Processor encompasses all of the currently supported processing options.
type Processor struct {
	BlurRadius      int
	SobelThreshold  int
	PointsThreshold int
	MaxPoints       int
	Wireframe       int
	Noise           int
	StrokeWidth     float64
	IsStrokeSolid   bool
	Grayscale       bool
	OutputToSVG     bool
	ShowInBrowser   bool
	BgColor         string
}

// Line defines the SVG line parameters.
type Line struct {
	P0          Node
	P1          Node
	P2          Node
	P3          Node
	FillColor   color.RGBA
	StrokeColor color.RGBA
}

// Image extends the Processor struct.
type Image struct {
	Processor
}

// SVG extends the Processor struct with the SVG parameters.
type SVG struct {
	Width         int
	Height        int
	Title         string
	Lines         []Line
	Color         color.RGBA
	Description   string
	StrokeLineCap string
	StrokeWidth   float64
	Processor
}

// Drawer interface defines the Draw method.
// This has to be implemented by every struct which declares a Draw method.
// By using this method the image can be triangulated as raster type or SVG.
type Drawer interface {
	Draw(interface{}, io.Writer) ([]Triangle, []Point, error)
}

// Draw is an interface method which triangulates the source type and outputs the result even to an image or a pixel data.
// The input could be an image file or a pixel data. This is the reason why interface is used as argument type.
// It returns the number of triangles generated, the number of points and the error in case exists.
func (im *Image) Draw(input interface{}, output interface{}, fn func()) (image.Image, []Triangle, []Point, error) {
	var (
		err    error
		src    interface{}
		srcImg *image.NRGBA
	)

	switch input.(type) {
	case *os.File:
		src, _, err = image.Decode(input.(io.Reader))
		if err != nil {
			return nil, nil, nil, err
		}
	default:
		src = input
	}

	width, height := src.(image.Image).Bounds().Dx(), src.(image.Image).Bounds().Dy()
	if width <= 1 || height <= 1 {
		err := errors.New("The image width and height must be greater than 1px.\n")
		return nil, nil, nil, err
	}

	// Define a new context and fill it with a background color.
	ctx := gg.NewContext(width, height)
	ctx.DrawRectangle(0, 0, float64(width), float64(height))
	if im.BgColor != "" {
		ctx.SetRGBA(1, 1, 1, 1)
	} else {
		ctx.SetRGBA(0, 0, 0, 0)
	}

	ctx.Fill()

	delaunay := &Delaunay{}
	img := ToNRGBA(src.(image.Image))

	blur := StackBlur(img, uint32(im.BlurRadius))
	gray := Grayscale(blur)
	sobel := SobelFilter(gray, float64(im.SobelThreshold))
	points := GetEdgePoints(sobel, im.PointsThreshold, im.MaxPoints)
	triangles := delaunay.Init(width, height).Insert(points).GetTriangles()

	if im.Grayscale {
		srcImg = gray
	} else {
		srcImg = img
	}

	for _, t := range triangles {
		p0, p1, p2 := t.Nodes[0], t.Nodes[1], t.Nodes[2]

		ctx.Push()
		ctx.MoveTo(float64(p0.X), float64(p0.Y))
		ctx.LineTo(float64(p1.X), float64(p1.Y))
		ctx.LineTo(float64(p2.X), float64(p2.Y))
		ctx.LineTo(float64(p0.X), float64(p0.Y))

		cx := float64(p0.X+p1.X+p2.X) * 0.33333
		cy := float64(p0.Y+p1.Y+p2.Y) * 0.33333

		j := ((int(cx) | 0) + (int(cy)|0)*width) * 4
		r, g, b, a := srcImg.Pix[j], srcImg.Pix[j+1], srcImg.Pix[j+2], srcImg.Pix[j+3]
		var strokeColor color.RGBA
		if im.IsStrokeSolid {
			strokeColor = color.RGBA{R: 0, G: 0, B: 0, A: 255}
		} else {
			strokeColor = color.RGBA{R: r, G: g, B: b, A: 255}
		}

		switch im.Wireframe {
		case WithoutWireframe:
			if a != 0 {
				ctx.SetFillStyle(gg.NewSolidPattern(color.RGBA{R: r, G: g, B: b, A: 255}))
			} else if im.BgColor != "" {
				ctx.SetHexColor(im.BgColor)
			}
			ctx.FillPreserve()
			ctx.Fill()
		case WithWireframe:
			if a != 0 {
				ctx.SetFillStyle(gg.NewSolidPattern(color.RGBA{R: r, G: g, B: b, A: 255}))
				ctx.SetStrokeStyle(gg.NewSolidPattern(color.RGBA{R: 0, G: 0, B: 0, A: 20}))
			} else if im.BgColor != "" {
				ctx.SetHexColor(im.BgColor)
			}
			ctx.SetLineWidth(im.StrokeWidth)
			ctx.FillPreserve()
			ctx.StrokePreserve()
			ctx.Stroke()
		case WireframeOnly:
			if a != 0 {
				ctx.SetStrokeStyle(gg.NewSolidPattern(strokeColor))
			} else if im.BgColor != "" {
				ctx.SetHexColor(im.BgColor)
			}
			ctx.SetLineWidth(im.StrokeWidth)
			ctx.StrokePreserve()
			ctx.Stroke()
		}
		ctx.Pop()
	}

	newImg := ctx.Image()
	switch output.(type) {
	case *os.File:
		// Apply a noise on the final image.
		if im.Noise > 0 {
			newImg = Noise(im.Noise, newImg, newImg.Bounds().Dx(), newImg.Bounds().Dy())
		}

		ext := filepath.Ext(output.(*os.File).Name())
		switch ext {
		case "", ".jpg", ".jpeg":
			if err = jpeg.Encode(output.(io.Writer), newImg, &jpeg.Options{Quality: 100}); err != nil {
				return nil, nil, nil, err
			}
		case ".png":
			if err = png.Encode(output.(io.Writer), newImg); err != nil {
				return nil, nil, nil, err
			}
		case ".bmp":
			if err = bmp.Encode(output.(io.Writer), newImg); err != nil {
				return nil, nil, nil, err
			}
		default:
			return nil, nil, nil, errors.New("unsupported image format")
		}
	}
	fn()
	return newImg, triangles, points, err
}

// Draw triangulates the source image and outputs the result to an SVG file.
// It has the same method signature as the rester Draw method, only that accepts a callback function
// for further processing, like opening the generated SVG file in the web browser.
// Everyone can define it's own callback function, depending on each one personal needs.
// It returns the number of triangles generated, the number of points and the error in case exists.
func (svg *SVG) Draw(input io.Reader, output io.Writer, fn func()) (image.Image, []Triangle, []Point, error) {
	const SVGTemplate = `<?xml version="1.0" ?>
	<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
	  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
	<svg width="{{.Width}}px" height="{{.Height}}px" viewBox="0 0 {{.Width}} {{.Height}}"
	     xmlns="http://www.w3.org/2000/svg" version="1.1">
	  <title>{{.Title}}</title>
	  <desc>{{.Description}}</desc>
	  <!-- Points -->
	  <g stroke-linecap="{{.StrokeLineCap}}" stroke-width="{{.StrokeWidth}}">
	    {{range .Lines}}
		<path
			fill="rgba({{.FillColor.R}},{{.FillColor.G}},{{.FillColor.B}},{{.FillColor.A}})"
	   		stroke="rgba({{.StrokeColor.R}},{{.StrokeColor.G}},{{.StrokeColor.B}},{{.StrokeColor.A}})"
			d="M{{.P0.X}},{{.P0.Y}} L{{.P1.X}},{{.P1.Y}} L{{.P2.X}},{{.P2.Y}} L{{.P3.X}},{{.P3.Y}}"
		/>
	    {{end}}</g>
	</svg>`

	var srcImg *image.NRGBA
	var (
		lines       []Line
		fillColor   color.RGBA
		strokeColor color.RGBA
	)

	src, _, err := image.Decode(input)
	if err != nil {
		return nil, nil, nil, err
	}

	width, height := src.Bounds().Dx(), src.Bounds().Dy()
	ctx := gg.NewContext(width, height)
	ctx.DrawRectangle(0, 0, float64(width), float64(height))
	ctx.SetRGBA(1, 1, 1, 1)
	ctx.Fill()

	delaunay := &Delaunay{}
	img := ToNRGBA(src)

	blur := StackBlur(img, uint32(svg.BlurRadius))
	gray := Grayscale(blur)
	sobel := SobelFilter(gray, float64(svg.SobelThreshold))
	points := GetEdgePoints(sobel, svg.PointsThreshold, svg.MaxPoints)
	triangles := delaunay.Init(width, height).Insert(points).GetTriangles()

	if svg.Grayscale {
		srcImg = gray
	} else {
		srcImg = img
	}

	for _, t := range triangles {
		p0, p1, p2 := t.Nodes[0], t.Nodes[1], t.Nodes[2]
		cx := float64(p0.X+p1.X+p2.X) * 0.33333
		cy := float64(p0.Y+p1.Y+p2.Y) * 0.33333

		j := ((int(cx) | 0) + (int(cy)|0)*width) * 4
		r, g, b := srcImg.Pix[j], srcImg.Pix[j+1], srcImg.Pix[j+2]

		if svg.IsStrokeSolid {
			strokeColor = color.RGBA{R: 0, G: 0, B: 0, A: 255}
		} else {
			strokeColor = color.RGBA{R: r, G: g, B: b, A: 255}
		}

		switch svg.Wireframe {
		case WithoutWireframe, WithWireframe:
			fillColor = color.RGBA{R: r, G: g, B: b, A: 255}
		case WireframeOnly:
			fillColor = color.RGBA{R: 255, G: 255, B: 255, A: 255}
		}
		lines = append(lines, []Line{
			{
				Node{p0.X, p0.Y},
				Node{p1.X, p1.Y},
				Node{p2.X, p2.Y},
				Node{p0.X, p0.Y},
				fillColor,
				strokeColor,
			},
		}...)
	}
	svg.Width = width
	svg.Height = height
	svg.Lines = lines

	tmpl := template.Must(template.New("svg").Parse(SVGTemplate))
	if err := tmpl.Execute(output, svg); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	// Trigger the callback function after the generation is completed.
	fn()
	return nil, triangles, points, err
}

// ToNRGBA converts any image type to *image.NRGBA with min-point at (0, 0).
func ToNRGBA(img image.Image) *image.NRGBA {
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
