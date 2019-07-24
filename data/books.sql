DROP TABLE IF EXISTS books;

CREATE TABLE books(
  id SERIAL PRIMARY KEY,
  author VARCHAR (255),
  title VARCHAR (255),
  isbn VARCHAR (15),
  image_url VARCHAR (255),
  description VARCHAR (255),
  bookshelf VARCHAR (255)
);

INSERT INTO books (author, title, isbn, image_url, description, bookshelf)
VALUES('Sarah Gina','WE ARE AWESOME','9283972891','https://learn.dojouniversity.com/wp-content/uploads/2017/11/do-i-hear-a-woot-woot.jpg','Woot woot woot.','Things we do at school');