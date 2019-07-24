'use strict';

//Application dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

//Environment variables
require('dotenv').config();

//Application setup
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

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

app.get('/books/:book_id', getOneBook);
app.post('/book', addBook);
app.get('/add', showForm);

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
Book.lookup = lookup;

function getOneBook(request, response) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [request.params.book_id];

  return client.query(SQL, values)
    .then(result => {
      return response.render('pages/books/detail', { book: result.rows[0]});
    })
    .catch(error => handleError(error, response));
}

function showForm(request, response) {
  response.render('pages/books/show'); //Need to confirm whether under books or searches
}

function addBook(request, response) {
  let {author, title, isbn, image_url, description, bookshelf} = request.body;

  let SQL = 'INSERT INTO books(author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';
  let values = [author, title, isbn, image_url, description, bookshelf];

  return client.query(SQL, values)
    .then(response.redirect('/'))
    .catch(error => handleError(error, response));
}

//Note that .ejs file extension is not required
function newSearch(request, response) {
  response.render('../views/pages/index')
}

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
  response.render('pages/error', { error: 'Oops.' });
}
