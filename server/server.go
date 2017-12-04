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
	"net/http"
	"strconv"
	"image/jpeg"
	"strings"
	"encoding/base64"

	"github.com/bmizerany/pat"
)

// options received from get request
type options struct {
	BlurRadius   	int
	SobelThreshold 	int
	Noise		int
	PointsThreshold	int
	MaxPoints	int
	Grayscale	bool
	SolidWireframe	bool
	WireframeType	int
	StrokeWidth	float64
}

// transformRequest is the result of an image transformation
// Message is a human readable message for the user
// Image is the actual transformed image
// ImgURL is the url for the transformed image
// A json serialization of transformResult is return to the browser
// as a server side event
type transformResult struct {
	Message string `json:"message"`
	Image   []byte `json:"-"`
	ImgURL  string `json:"img"`
	SrcURL  string `json:"src"`
	B64Img	string `json:"b64img"`
}

// downloadAndTransformImage does an HTTP GET for rawurl
// and if it is a jpeg or png image it applies the transform
func downloadAndTransformImage(rawurl string, opts options, transform func(image.Image, options) image.Image) (image.Image, error) {
	var decodedImg image.Image

	// Obtain the image type from the data url
	idx := strings.Index(rawurl, ",")
	imgType := strings.TrimSuffix(rawurl[5:idx], ";base64")

	// Decode the string
	rawImage := string(rawurl)[idx+1:]
	unbased, err := base64.StdEncoding.DecodeString(rawImage)
	if err != nil {
		log.Panicln("Cannot decode base64 image!")
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
	return transform(decodedImg, opts), nil
}

var addr = flag.String("a", ":8080", "Server address")

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

		blurRadius, _ 	   := strconv.Atoi(req.FormValue("blurRadius"))
		sobelThreshold, _  := strconv.Atoi(req.FormValue("sobelThreshold"))
		noise, _ 	   := strconv.Atoi(req.FormValue("noise"))
		pointsTreshold, _  := strconv.Atoi(req.FormValue("pointsThreshold"))
		maxPoints, _ 	   := strconv.Atoi(req.FormValue("maxPoints"))
		grayscale, _ 	   := strconv.ParseBool(req.FormValue("grayscale"))
		solidWireframe, _  := strconv.ParseBool(req.FormValue("solidWireframe"))
		wireframeType, _   := strconv.Atoi(req.FormValue("wireframeType"))
		strokeWidth, _	   := strconv.ParseFloat(req.FormValue("strokeWidth"), 64)

		imgurl := req.FormValue("image")
		imgPath := req.FormValue("imagePath")

		opts := &options{
			BlurRadius: 	 blurRadius,
			SobelThreshold:  sobelThreshold,
			Noise: 		 noise,
			PointsThreshold: pointsTreshold,
			MaxPoints: 	 maxPoints,
			Grayscale: 	 grayscale,
			SolidWireframe:  solidWireframe,
			WireframeType: 	 wireframeType,
			StrokeWidth: 	 strokeWidth,
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
					B64Img:	 "data:image/png;base64," + imgBase64Str,
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
	log.Printf("Starting server on port%s", *addr)

	http.Handle("/", m)
	http.ListenAndServe(*addr, nil)
}
