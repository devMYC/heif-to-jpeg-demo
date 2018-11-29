# The demo uses [libheif](https://github.com/strukturag/libheif/blob/gh-pages/libheif.js)

# Run the demo

- Make sure [Node.js](https://nodejs.org/en/) is available


### Node.js demo

```bash
$ yarn  # or npm install
$ node demo.js
```


### Web demo

```bash
$ node server.js  # default port 8000, or use PORT environment variable to specify a different port.
```

Open your browser and go to `http://localhost:<port>/demo.html`.


### Express + Multer demo

```bash
$ yarn  # or npm install
$ node express-demo.js  # default port 8000, or use PORT environment variable to specify a different port.
```

In a new terminal window

```bash
$ curl -X POST http://localhost:<port>/img/upload -F file=@somefile.ext
```

To view the uploaded image, copy the `file_name` returned and send a GET request to `http://localhost:<port>/img/<file_name>` in your browser.
