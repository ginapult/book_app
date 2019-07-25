'use strict';

//Application dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

//Application setup
const app = express();
const PORT = process.env.PORT || 3000;

//Database setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

//Application middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

//Set the view engine for server-side templating
app.set('view engine', 'ejs');

//API Routes
app.get('/', getBooks);
app.post('/searches', createSearch);
app.get('/searches/new', newSearch);
app.post('/books', createBook);
app.get('/books/:id', getBook);

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

function getBooks(request, response) {
  let SQL = 'SELECT * FROM books;';

  return client.query(SQL)
    .then(results => {
      if (results.rows.rowCount === 0) {
        response.render('pages/searches/new');
      } else {
        response.render('pages/index', { books: results.rows })
      }
    })
    .catch(err => handleError(err, response));
}

function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }))
    .catch(err => handleError(err, response));
}

//Note that .ejs file extension is not required
function newSearch(request, response) {
  response.render('pages/searches/new')
}

function createBook(request, response) {
  let normalizedShelf = request.body.bookshelf.toLowerCase();

  let { title, author, isbn, image_url, description } = request.body;
  let SQL = 'INSERT INTO books(title, author, isbn, image_url, description, bookshelf) VALUES($1, $2, $3, $4, $5, $6);';
  let values = [title, author, isbn, image_url, description, normalizedShelf];

  return client.query(SQL, values)
    .then(() => {
      SQL = 'SELECT * FROM books WHERE isbn=$1;';
      values = [request.body.isbn];
      return client.query(SQL, values)
        .then(result => response.redirect(`/books/${result.rows[0].id}`))
        .catch(handleError);
    })
    .catch(err => handleError(err, response));
}

function getBook(request, response) {
  getBookshelves()
    .then(shelves => {
      let SQL = 'SELECT * FROM books WHERE id=$1;';
      let values = [request.params.book_id];
      client.query(SQL, values)
        .then(result => response.render('pages/books/show', { book:result.rows[0], bookshelves: shelves.rows }))
        .catch(err => handleError(err, response));
    })
}

function getBookshelves() {
  let SQL = 'SELECT DISTINCT bookshelf FROM books ORDER BY bookshelf;';

  return client.query(SQL);
}

//Handle errors
function handleError(error, response) {
  response.render('pages/error', { error: 'Oops.' });
}
