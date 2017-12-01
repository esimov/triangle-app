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
	"sync"
	"time"
	"strconv"
	"image/jpeg"
	"strings"
	"encoding/base64"

	"github.com/bmizerany/pat"
)

const (
	// keyExpirationInMinutesall is the duration after which
	// all in-memory images are discarded
	keyExpirationInMinutes = time.Duration(5) * time.Minute
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

// transformRequest is the payload of an HTTP request for an image transformation
type transformRequest struct {
	Image	string
	ImgPath	string
	options
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

// transforms is an in-memory storage for transformed images
var transforms struct {
	sync.Mutex
	images map[string]*transformResult
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

// transformer receives a request from in, executes it and responds
// to out. The requests come from a separate HTTP handler and the
// responses always go to the sse endpoint.
func transformer(in <-chan *transformRequest, out chan<- *event) {
	for {
		req := <-in
		log.Printf("Transformer starts for %q", req.ImgPath)

		var img image.Image
		var err error

		img, err = downloadAndTransformImage(req.Image, req.options, triangulate)

		if err == nil {
			var b bytes.Buffer
			if err = png.Encode(&b, img); err == nil {
				key := fmt.Sprintf("%x", sha1.Sum(b.Bytes()))[0:8]
				imgBase64Str := base64.StdEncoding.EncodeToString(b.Bytes())

				res := &transformResult{
					Message: fmt.Sprintf("Ready: %s", req.ImgPath),
					Image:   b.Bytes(),
					ImgURL:  fmt.Sprintf("/image/%s", key),
					SrcURL:  req.Image,
					B64Img:	 "data:image/png;base64," + imgBase64Str,
				}

				var enc []byte
				enc, err = json.Marshal(res)
				if err == nil {
					transforms.Lock()
					transforms.images[key] = res
					transforms.Unlock()
					// easier to start a goroutine for expiration
					// than implement a form of GC with timestamps in transforms
					go func(k, u string) {
						<-time.After(keyExpirationInMinutes)
						transforms.Lock()
						delete(transforms.images, k)
						transforms.Unlock()
						log.Printf("Expired key %s for %q", k, u)
					}(key, req.ImgPath)

					out <- &event{"image", string(enc), ""}
					log.Printf("Transformer finished for %q", req.ImgPath)
				}
			}
		}
		if err != nil {
			log.Printf("Transformer failed for %q: %s", req.ImgPath, err.Error())
			out <- &event{"Problem: ", err.Error(), ""}
		}
	}
}

// event is a SSE event
type event struct {
	Event       string
	Data        string
	LastEventID string
}

// newSSEHandler is an HTTP handler for server side events
// each value for ec becomes an sse event
// also every d sends a comment to keep the connection alive
func newSSEHandler(ec chan *event, d time.Duration) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		log.Println("Accepted connection from", req.RemoteAddr)

		fl, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "ResponseWriter does not support Flusher", http.StatusInternalServerError)
			return
		}

		cn, ok := w.(http.CloseNotifier)
		if !ok {
			http.Error(w, "ResponseWriter does not support CloseNotifier", http.StatusInternalServerError)
			return
		}
		cnc := cn.CloseNotify()

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.WriteHeader(http.StatusOK)

		ticker := time.NewTicker(d)
		for {
			select {
			case ev := <-ec:
				if ev.Event != "" {
					fmt.Fprintf(w, "event: %s\ndata: %s\n\n", ev.Event, ev.Data)
				} else {
					fmt.Fprintf(w, "data: %s\n\n", ev.Data)
				}
			case <-ticker.C:
				fmt.Fprintf(w, ": comment\n\n")
			case <-cnc:
				log.Println("Closing connection from ", req.RemoteAddr)
				fl.Flush()
				ticker.Stop()
				return
			}
			fl.Flush()
		}
	})
}

func imageHandler(w http.ResponseWriter, req *http.Request) {
	key := req.URL.Query().Get(":key")

	var res *transformResult
	var found bool
	transforms.Lock()
	res, found = transforms.images[key]
	transforms.Unlock()

	if !found {
		http.Error(w, fmt.Sprintf("No image with key %s", key), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.WriteHeader(http.StatusOK)
	w.Write(res.Image)
}

var addr = flag.String("a", ":8080", "Server address")
var workers = flag.Int("n", 1, "Transformation workers")
var sseDuration = flag.Duration("k", time.Duration(4)*time.Second, "Keep alive sse duration")

func main() {
	log.SetPrefix("\x1b[39m▲ TRIANGLE : ")
	flag.Parse()

	transforms.images = make(map[string]*transformResult)
	eventsCh := make(chan *event)
	// a buffered channel because we want the request handler to respond fast
	tc := make(chan *transformRequest, 100)

	for i := 0; i < *workers; i++ {
		go transformer(tc, eventsCh)
	}

	m := pat.New()
	m.Get("/triangle", newSSEHandler(eventsCh, *sseDuration))
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

		tc <- &transformRequest{imgurl, imgPath, *opts}
		log.Printf("Transformer accepted for %q", imgPath)
		w.WriteHeader(http.StatusAccepted)

	}))
	m.Get("/image/:key", http.HandlerFunc(imageHandler))
	http.Handle("/", m)

	log.Printf("Starting server on port%s", *addr)
	http.ListenAndServe(*addr, nil)
}
