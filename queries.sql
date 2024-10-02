CREATE TABLE books (
	id SERIAL PRIMARY KEY,
	title VARCHAR(100),
	isbn VARCHAR(20),
	cover VARCHAR(10),
	link_key VARCHAR(20),
	synopsis TEXT
);

INSERT INTO books (title, isbn, cover, link_key, synopsis)
VALUES ('48 Laws of Power', '9781861972781', '917683', 'OL8631581M', 'Amoral, cunning, ruthless, and instructive, this piercing work distills three thousand years of the history of power into 48 well-explicated laws. It outlines the laws of power in their unvarnished essence, synthesizing the philosophies of Machiavelli, Sun-tzu, Carl von Clausewitz, and other great thinkers. Some laws teach the need for prudence, the virtue of stealth, and many demand the total absence of mercy, but like it or not, all have applications in real life. Illustrated through the tactics of Queen Elizabeth I, Henry Kissinger, P. T. Barnum, and other famous figures who have wielded--or been victimized by--power, these laws will fascinate any reader interested in gaining, observing, or defending against ultimate control.');

INSERT INTO books (title, isbn, cover, link_key, synopsis)
VALUES ('Thinking, fast and slow', '9780141033570', '7256677', 'OL25426844M', "The guru to the gurus at last shares his knowledge with the rest of us. Nobel laureate Daniel Kahneman's seminal studies in behavioral psychology, behavioral economics, and happiness studies have influenced numerous other authors, including Steven Pinker and Malcolm Gladwell. In Thinking, Fast and Slow, Kahneman at last offers his own, first book for the general public. It is a lucid and enlightening summary of his life's work. It will change the way you think about thinking. Two systems drive the way we think and make choices, Kahneman explains: System One is fast, intuitive, and emotional; System Two is slower, more deliberative, and more logical. Examining how both systems function within the mind, Kahneman exposes the extraordinary capabilities as well as the biases of fast thinking and the pervasive influence of intuitive impressions on our thoughts and our choices. Engaging the reader in a lively conversation about how we think, he shows where we can trust our intuitions and how we can tap into the benefits of slow thinking, contrasting the two-system view of the mind with the standard model of the rational economic agent. Kahneman's singularly influential work has transformed cognitive psychology and launched the new fields of behavioral economics and happiness studies. In this path-breaking book, Kahneman shows how the mind works, and offers practical and enlightening insights into how choices are made in both our business and personal lives--and how we can guard against the mental glitches that often get us into trouble.");


INSERT INTO books (title, isbn, cover, link_key, synopsis)
VALUES ('The Design of Everyday Things', '9781861972781', '8749094', 'OL27255111M', 'The Design of Everyday Things is a best-selling book by cognitive scientist and usability engineer Donald Norman about how design serves as the communication between object and user, and how to optimize that conduit of communication in order to make the experience of using the object pleasurable. One of the main premises of the book is that although people are often keen to blame themselves when objects appear to malfunction, it is not the fault of the user but rather the lack of intuitive guidance that should be present in the design.');

CREATE TABLE reviews (
	id INTEGER REFERENCES books(id) UNIQUE,
	reading_date VARCHAR(45),
	rate INTEGER,
	notes TEXT	
);

INSERT INTO reviews (id, reading_date, rate, notes)
VALUES (1, '2023-12-31', 5, 'This are the notes of 48 Laws of Power');

INSERT INTO reviews (id, reading_date, rate, notes)
VALUES (2, '2024-3-15', 7, 'This are the notes of Thinking, fast and slow');

INSERT INTO reviews (id, reading_date, rate, notes)
VALUES (3, '2024-9-17', 10, 'This are the notes of Design of Everyday Things');

CREATE TABLE authors (
	id SERIAL PRIMARY KEY,
	link_key VARCHAR(20)
);

INSERT INTO authors (link_key)
VALUES ('OL236414A'), ('OL224036A'), ('OL2066695A'), ('OL224976A'); -- livros 1; 1; 2; 3


CREATE TABLE rel_books_authors (
    author_id INTEGER REFERENCES authors(id),
    book_id INTEGER REFERENCES books(id),
    PRIMARY KEY (author_id, book_id) 
);

INSERT INTO rel_books_authors (author_id, book_id)
VALUES (1, 1), (2, 1), (3, 2), (4, 3);


--SELECIONAR OS AUTORES DE UM DETERMINADO LIVRO
SELECT books.title, authors.link_key
FROM rel_books_authors
INNER JOIN authors ON authors.id = rel_books_authors.author_id
INNER JOIN books ON books.id = rel_books_authors.book_id
WHERE books.id = 1;

--SELECIONAR TODAS AS INFORMAÇÕES DE TODOS OS LIVROS
SELECT books.id, books.title, reviews.reading_date, reviews.rate, books.synopsis
FROM books
INNER JOIN reviews ON reviews.id = books.id;

--SELECIONAR TODAS AS INFORMAÇÕES DE UM DETERMINADO LIVRO
SELECT books.id, books.title, reviews.reading_date, reviews.rate, books.synopsis
FROM books
INNER JOIN reviews ON reviews.id = books.id
WHERE books.id = 1;

--EDITAR UM LIVRO ESPECÍFICO
UPDATE books
SET isbn = ($1)
WHERE id = ($2);

--SELECIONAR OS AUTORES DE UM DETERMINADO LIVRO
SELECT *
FROM rel_books_authors
INNER JOIN books ON books.id = rel_books_authors.book_id
INNER JOIN authors ON authors.id = rel_books_authors.author_id
WHERE books.id = ($1);