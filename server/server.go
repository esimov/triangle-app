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
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/jpeg"
	"image/png"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/pat"
)

// options received from a Get request
type options struct {
	BlurRadius      int
	SobelThreshold  int
	Noise           int
	PointsThreshold int
	MaxPoints       int
	CoordCenter     float64
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

// transformResult is the result of an image transformation
// Message is a human readable message for the user
// Image is the actual transformed image
// ImgURL is the url of the transformed image
// B64Img is the image encoded as a base64 url
// A json serialization of transformResult is returned to the browser as a server side event
type transformResult struct {
	Message string `json:"message"`
	Image   []byte `json:"-"`
	ImgURL  string `json:"img"`
	SrcURL  string `json:"src"`
	B64Img  string `json:"b64img"`
}

// Server address. It defaults to 8080 port.
var addr = flag.String("a", ":8080", "Server address")

func main() {
	log.SetPrefix("\x1b[39m▲ TRIANGLE : ")
	flag.Parse()

	router := pat.New()
	router.Post("/images", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
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
		coordCenter, _ := strconv.ParseFloat(req.FormValue("coordCenter"), 64)
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
			BlurRadius:      blurRadius,
			SobelThreshold:  sobelThreshold,
			Noise:           noise,
			PointsThreshold: pointsTreshold,
			MaxPoints:       maxPoints,
			CoordCenter:     coordCenter * 0.01,
			Grayscale:       grayscale,
			SolidWireframe:  solidWireframe,
			WireframeType:   wireframeType,
			WireframeColor:  color.RGBA{wfcol.R, wfcol.G, wfcol.B, wfcol.A},
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
					B64Img:  "data:image/png;base64," + imgBase64Str,
				}

				var enc []byte
				enc, err = json.Marshal(res)
				if err == nil {
					w.Header().Set("Content-Type", "text/plain")
					w.Header().Set("Access-Control-Allow-Origin", "*")
					w.WriteHeader(http.StatusOK)

					fmt.Fprint(w, string(enc))
				}
			}
		}
	}))

	router.Post("/save", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
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

	http.Handle("/", router)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

// downloadAndTransformImage receives an HTTP Post, applies the transform options and returns the triangulated image in base64 form.
func downloadAndTransformImage(b64img string, opts options, fn func(image.Image, options) image.Image) (image.Image, error) {
	decodedImg, err := decodeB64Img(b64img)
	if err != nil {
		return nil, err
	}
	return fn(decodedImg, opts), nil
}

// saveTriangulatedImage saves the triangulated image locally. On success it returns the image path, otherwise the error message.
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

// decodeB64Img transforms the base url image to the base64 encoded *.jpeg or *.png file.
func decodeB64Img(b64img string) (image.Image, error) {
	var decodedImg image.Image

	// Obtain the image type from the data url
	idx := strings.Index(b64img, ",")
	imgType := strings.TrimSuffix(b64img[5:idx], ";base64")

	// Decode the string
	rawImage := string(b64img)[idx+1:]
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
