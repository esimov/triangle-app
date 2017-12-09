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
	"bytes"
	"crypto/sha1"
	"encoding/json"
	"flag"
	"fmt"
	"image"
	_ "image/jpeg"
	"image/png"
	"log"
	"os"
	"net/http"
	"strconv"
	"image/jpeg"
	"strings"
	"encoding/base64"
	"image/color"

	"github.com/bmizerany/pat"
)

// options received from get request
type options struct {
	BlurRadius      int
	SobelThreshold  int
	Noise           int
	PointsThreshold int
	MaxPoints       int
	Grayscale       bool
	SolidWireframe  bool
	WireframeType   int
	WireframeColor  color.RGBA
	StrokeWidth     float64
}

type wireframeColor struct {
	R uint8 `json:"r"`
	G uint8 `json:"g"`
	B uint8 `json:"b"`
	A uint8 `json:"a"`
}

// transformRequest is the result of an image transformation
// Message is a human readable message for the user
// Image is the actual transformed image
// ImgURL is the url for the transformed image
// B64Img is the image encoded as a base64 url
// A json serialization of transformResult is return to the browser as a server side event
type transformResult struct {
	Message string `json:"message"`
	Image   []byte `json:"-"`
	ImgURL  string `json:"img"`
	SrcURL  string `json:"src"`
	B64Img  string `json:"b64img"`
}

// Receive a HTTP Post, applies the transform options and returns the triangulated image in B64 form
func downloadAndTransformImage(b64img string, opts options, transform func(image.Image, options) image.Image) (image.Image, error) {
	decodedImg, err := decodeB64Img(b64img)
	if err != nil {
		return nil, err
	}
	return transform(decodedImg, opts), nil
}

// Save the triangulated image locally. On success it returns the image path, otherwise the error message.
func saveTriangulatedImage(b64img string, imgPath string) error {
	fn, err := os.Create(imgPath)
	decodedImg, err := decodeB64Img(b64img)
	if err != nil {
		fmt.Printf("Error creating image file %v.", err)
		return err
	}

	if err := jpeg.Encode(fn, decodedImg, &jpeg.Options{100}); err != nil {
		fmt.Printf("Error encoding the triangulated image %v", err)
		return err
	}
	return nil
}

// Transform the base url image to the encoded *.jpeg or *.png file.
func decodeB64Img(b64img string) (image.Image, error) {
	var decodedImg image.Image

	// Obtain the image type from the data url
	idx := strings.Index(b64img, ",")
	imgType := strings.TrimSuffix(b64img[5:idx], ";base64")

	// Decode the string
	rawImage := string(b64img)[idx + 1:]
	unbased, err := base64.StdEncoding.DecodeString(rawImage)
	if err != nil {
		fmt.Printf("Cannot decode base64 image! %v", err)
	}
	res := bytes.NewReader(unbased)

	// Encode the byte string to the corresponding image type
	switch imgType {
	case "image/png":
		decodedImg, err = png.Decode(res)
		if err != nil {
			fmt.Printf("Error encoding png image %v.", err)
			return nil, err
		}
	case "image/jpeg":
		decodedImg, err = jpeg.Decode(res)
		if err != nil {
			fmt.Printf("Error encoding jpeg image %v.", err)
			return nil, err
		}
	}
	return decodedImg, nil
}

// Server address. It defaults to 8080 port.
var addr = flag.String("a", ":8080", "Server address")

// Main function
func main() {
	log.SetPrefix("\x1b[39m▲ TRIANGLE : ")
	flag.Parse()

	m := pat.New()
	m.Post("/images", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		req.ParseForm()
		if req.Form == nil {
			http.Error(w, "Please send a valid request form", 400)
			return
		}

		blurRadius, _ := strconv.Atoi(req.FormValue("blurRadius"))
		sobelThreshold, _ := strconv.Atoi(req.FormValue("sobelThreshold"))
		noise, _ := strconv.Atoi(req.FormValue("noise"))
		pointsTreshold, _ := strconv.Atoi(req.FormValue("pointsThreshold"))
		maxPoints, _ := strconv.Atoi(req.FormValue("maxPoints"))
		grayscale, _ := strconv.ParseBool(req.FormValue("grayscale"))
		solidWireframe, _ := strconv.ParseBool(req.FormValue("solidWireframe"))
		wireframeType, _ := strconv.Atoi(req.FormValue("wireframeType"))
		strokeWidth, _ := strconv.ParseFloat(req.FormValue("strokeWidth"), 64)

		// Decode json encoded wireframe color into RGBA type.
		var wfcol wireframeColor
		err := json.Unmarshal([]byte(req.FormValue("wireframeColor")), &wfcol)
		if err != nil {
			log.Printf("Cannot decode wireframe color %v", err)
		}

		imgurl := req.FormValue("image")
		imgPath := req.FormValue("imagePath")

		opts := &options{
			BlurRadius:     blurRadius,
			SobelThreshold:  sobelThreshold,
			Noise:         noise,
			PointsThreshold: pointsTreshold,
			MaxPoints:     maxPoints,
			Grayscale:     grayscale,
			SolidWireframe:  solidWireframe,
			WireframeType:     wireframeType,
			WireframeColor:    color.RGBA{wfcol.R, wfcol.G, wfcol.B, wfcol.A},
			StrokeWidth:     strokeWidth,
		}
		log.Printf("Transformer accepted for %q", imgPath)

		img, err := downloadAndTransformImage(imgurl, *opts, triangulate)
		if err == nil {
			var b bytes.Buffer
			if err = png.Encode(&b, img); err == nil {
				key := fmt.Sprintf("%x", sha1.Sum(b.Bytes()))[0:8]
				imgBase64Str := base64.StdEncoding.EncodeToString(b.Bytes())

				res := &transformResult{
					Message: fmt.Sprintf("Ready: %s", imgPath),
					Image:   b.Bytes(),
					ImgURL:  fmt.Sprintf("/image/%s", key),
					SrcURL:  imgPath,
					B64Img:     "data:image/png;base64," + imgBase64Str,
				}

				var enc []byte
				enc, err = json.Marshal(res)
				if err == nil {
					w.Header().Set("Content-Type", "text/plain")
					w.Header().Set("Access-Control-Allow-Origin", "*")
					w.WriteHeader(http.StatusOK)

					fmt.Fprintf(w, string(enc))
				}
			}
		}
	}))

	m.Post("/save", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		req.ParseForm()
		if req.Form == nil {
			http.Error(w, "Invalid request form.", 400)
			return
		}
		imgurl := req.FormValue("url")
		b64img := req.FormValue("b64img")

		err := saveTriangulatedImage(b64img, imgurl)
		if err != nil {
			fmt.Fprintf(w, "Saving triangulated image failed, %v", err)
		}
		log.Printf("The triangulated image has been saved to: %v", imgurl)

		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)

		fmt.Fprintf(w, "The triangulated image has been saved into: %s", string(imgurl))
	}))

	log.Printf("Starting server on port%s", *addr)

	http.Handle("/", m)
	http.ListenAndServe(*addr, nil)
}
