'use strict';

//Application dependencies
const express = require('express');
const superagent = require('superagent');

//Application setup
const app = express();
const PORT = process.env.PORT || 3000;

//Application middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

//Set the view engine for server-side templating
app.set('view engine', 'ejs');

//API Routes
//Renders the search form
app.get('/', newSearch);

//Creates a new search to the Google Books API (Handler)
app.post('/searches', createSearch);

//Catch-all
app.get('*', (request, response) => response.status(404).send('404 Error: This route does not exist.'));

//PORT listener
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));

//Helper functions
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g

  this.title = info.title ? info.title : 'No title available.';
  this.authors = info.authors ? info.authors[0] : 'No author available.';
  this.isbn = info.industryIdentifiers ? `ISBN_13 ${info.industryIdentifiers[0].identifier}` : 'No ISBN available.';
  this.image = info.imageLinks ? info.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeholderImage;
  this.description = info.description ? info.description : 'No description available.';
  this.id = info.industryIdentifiers ? `${info.industryIdentifiers[0].identifier}` : '';
}

//Note that .ejs file extension is not required
function newSearch(request, response) {response.render('pages/index')}

//Note that no API required

//Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body);
  console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }))
    .catch(err => handleError(err, response));
}

//Handle errors
function handleError(error, response) {
  response.render('pages/error', { error: error });
}