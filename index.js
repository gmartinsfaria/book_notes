import express from 'express';
import bodyParser from "body-parser";
import axios from 'axios';
import pg from "pg";

const app = express();
const port = 3000;
const API_URL = "https://openlibrary.org"

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "reading",
    password: "yourpassword",
    port: 5432,
});

db.connect();


let books = [];

let details = [];

let sorting = "date";


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function booksInfoGetter(order) {
    //console.log(`ESTÁ A RETORNAR A ORDEM NA FUNÇÃO BOOKSINFOGETTER. A ORDEM É: ${order}`);

    if (order == "date") {
        const result = await db.query("SELECT books.id, books.title, books.cover, books.link_key, reviews.reading_date, reviews.rate, books.synopsis FROM books INNER JOIN reviews ON reviews.id = books.id ORDER BY reviews.reading_date DESC");
        books = result.rows;

    } else if (order == "title") {
        const result = await db.query("SELECT books.id, books.title, books.cover, books.link_key, reviews.reading_date, reviews.rate, books.synopsis FROM books INNER JOIN reviews ON reviews.id = books.id ORDER BY books.title ASC");
        books = result.rows;

    }else if (order == "rating") {
        const result = await db.query("SELECT books.id, books.title, books.cover, books.link_key, reviews.reading_date, reviews.rate, books.synopsis FROM books INNER JOIN reviews ON reviews.id = books.id ORDER BY reviews.rate DESC");
        books = result.rows;

    }

    return books;
}

async function authorsInEachBook(){
    const result = await db.query("SELECT books.id, authors.link_key FROM rel_books_authors INNER JOIN authors ON authors.id = rel_books_authors.author_id INNER JOIN books ON books.id = rel_books_authors.book_id")

    return result.rows;
}


async function masterDetailGetter(id) {
    const result = await db.query("SELECT books.id, books.title, books.cover, books.synopsis, books.isbn, reviews.reading_date, reviews.rate, reviews.notes FROM books INNER JOIN reviews ON reviews.id = books.id WHERE books.id = ($1)", 
        [id]
    );

    details = result.rows;

    return details;
}

async function authorMasterDetailGetter(id){
    
    const result = await db.query("SELECT books.id, authors.link_key FROM rel_books_authors INNER JOIN authors ON authors.id = rel_books_authors.author_id INNER JOIN books ON books.id = rel_books_authors.book_id WHERE books.id = ($1)",
        [id]
    );

    return result.rows;
}

async function updateBookDetails(id, isbn, date, rate, notes) {
    await db.query("UPDATE books SET isbn = ($1) WHERE id = ($2)", 
        [isbn, id]
    );

    await db.query("UPDATE reviews SET reading_date = ($1), rate = ($2), notes = ($3) WHERE id = ($4)",
        [date, rate, notes, id]
    );
}

async function addNewBookToDB(title, isbn, cover, link_key, synopsis){

    const result = await db.query("INSERT INTO books (title, isbn, cover, link_key, synopsis) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [title, isbn, cover, link_key, synopsis]
    );

    const id = result.rows[0].id;
    return id;
}

async function addAuthorsForEachBook(bookId, authors){

    //console.log(`Array authors na função addAuthors ${authors}`);

    authors.forEach(async (author) => {
        const result = await db.query("INSERT INTO authors (link_key) VALUES ($1) RETURNING *",
            [author.key.slice(9)]
        );
    
        /*authors.forEach((author) => {
            console.log(author.key.slice(9));  // Acede ao valor de 'key' de cada autor /////////////////////////////////////////// CONTINUAR AQUI
            authorsArray.push(author.key.slice(9));
          });*/

        let authorId = result.rows[0].id;

        //console.log(`O ID DO AUTHOR NA FUNÇÃO ADDAUTHORS É: ${authorId}`);

        await db.query("INSERT INTO rel_books_authors (author_id, book_id) VALUES ($1, $2)",
            [authorId, bookId]
        )

    });

}

async function addReviewToEachBook(bookId, reading_date, rate, notes){
    await db.query("INSERT INTO reviews (id, reading_date, rate, notes) VALUES ($1, $2, $3, $4)", 
        [bookId, reading_date, rate, notes]
    );
};

async function fetchInfoFromAPI(isbn){
    //Para fazer o get das capas dos livros, podemos utilizar o seguinte url: https://covers.openlibrary.org/b/id/8749094-S.jpg
    //Para aceder ao id da cover, basta aceder a response.data.covers[0]

    //Para fazer o get das imagens dos autores, podemos utilizar o seguinte url: 
    //Para aceder ao id do autor, basta aceder a result.authors[0].key.slice(9) --ATENÇÃO QUE PODE HAVER MAIS DO QUE UM AUTOR É NESESSÁRIO PASSAR OS AUTORES EM ARRAY

    //Para aceder ao titulo,--> result.title

    //Para aceder ao link do livro usar https://openlibrary.org + result.key.slice(7);

    //Para aceder ao link do autor usar https://openlibrary.org + result.authors[id].key;

    try {

        const response = await axios.get(`${API_URL}/isbn/${isbn}`);
        console.log(`Data from API: ${response.data}`);
        return response.data;
        

    }catch (error){
        console.log(error.message);
    }

}

async function deleteBook(id){
    await db.query("DELETE FROM rel_books_authors WHERE book_id = ($1)",
        [id]
    );

    await db.query("DELETE FROM reviews WHERE id = ($1)",
        [id]
    );

    await db.query("DELETE FROM books WHERE id = ($1)", 
        [id]
    );
}


app.get('/', async (req, res) => {    
    let bookList = [];
    let authorsEachBook = [];

    try {
        bookList = await booksInfoGetter(sorting);
        authorsEachBook = await authorsInEachBook();

        //console.log(bookList);
        //console.log("O ID DO AUTOR É: " + result.authors[0].key.slice(9));
        //console.log("A COVER DO LIVRO CORRESPONDE A:" + result.covers[0]);
        //console.log(result);

        res.render("index.ejs", {
            //title: result.title,
            //cover: result.covers[0],
            //author: result.authors[0].key.slice(9),
            books: bookList,
            authors: authorsEachBook,
        })

    } catch (error) {
        console.log("Failed to make request:", error.message);
        res.render("index.ejs", {
            error: error.message,
        })
    }

});

app.get('/order_by', async (req, res) => {
    const sortingMethod = req.query.sorting; // pode ser: date, rating ou title

    sorting = sortingMethod;

    //console.log(`SORTING METHOD IS: ${sortingMethod}`);


    res.redirect('/');


});

app.get('/new_book_link', (req, res) => {
    res.render('new_book.ejs');

});

app.post('/add_new_book', async (req, res) => {
    const title = req.body.title;
    const isbn = req.body.isbn;
    const synopsis = req.body.synopsis;

    const reviewDate = req.body.date;
    const reviewRate = req.body.rate;
    const reviewNotes = req.body.yourNotes;

    let cover;
    let link_key;
    let authors;
    let authorsArray = [];


    try {
        const bookDataFromAPI = await fetchInfoFromAPI(isbn);
        //console.log(`A INFORMAÇÃO VINDA DA API - TÍTULO É: ${bookDataFromAPI.title}`);

        cover = bookDataFromAPI.covers[0];
        link_key = bookDataFromAPI.key.slice(7);
        authors = bookDataFromAPI.authors; //Para aceder ao link do autor usar https://openlibrary.org + result.authors[id].key;

        //console.log(`COVER É: ${cover}`);
        //console.log(`LINK_KEY É: ${link_key}`);
        //console.log(`AUTHORS É: ${authors}`);

        /*authors.forEach((author) => {
            console.log(author.key.slice(9));  // Acede ao valor de 'key' de cada autor /////////////////////////////////////////// CONTINUAR AQUI
            authorsArray.push(author.key.slice(9));
          });*/


        const bookId = await addNewBookToDB(title, isbn, cover, link_key, synopsis);

        //console.log(`O ID DO LIVRO CRIADO É: ${bookId}`);

        await addAuthorsForEachBook(bookId, authors);

        await addReviewToEachBook(bookId, reviewDate, reviewRate, reviewNotes);


    }catch (error) {
        console.log(error.message);
    }


    //console.log(`O TÍTULO É: ${title}`);
    //console.log(`O ISBN É: ${isbn}`);
    //console.log(`A SYNOPSE É: ${synopsis}`);
    //console.log(`A DATA DE FINALIZAÇÃO DE LEITURA É: ${reviewDate}`);
    //console.log(`O RATE É: ${reviewRate}`);
    //console.log(`AS NOTAS SÃO: ${reviewNotes}`);

    res.redirect('/');


});

app.post('/master_detail', async (req, res) => {
    const bookId = req.body.book;
    //console.log(`ENTROU NO BOOK ID E O ID SELECIONADO É ${bookId}`);

    let allDetails = [];
    let allAuthors = [];


    try {
        allDetails = await masterDetailGetter(bookId);
        allAuthors = await authorMasterDetailGetter(bookId);
        //console.log(`ALL AUTHORS: ${allAuthors[0].link_key}`);
        
        res.render("master_detail.ejs", {
            bookDetails: allDetails[0],
            authors: allAuthors,
        });

    } catch (error) {
        console.log("Failed to make request:", error.message);
        res.render("index.ejs", {
            error: error.message,
        })
    }
});

app.post('/edit', async (req, res) => {
    const id = req.body.bookId;
    const changedISBN = req.body.updatedISBN;
    const changedDate = req.body.updatedReadingDate;
    const changedRate = req.body.updatedRate;
    const changedNotes = req.body.updatedNotes;

    //console.log(`ID: ${id}`);

    try {
        await updateBookDetails(id, changedISBN, changedDate, changedRate, changedNotes);
        
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
        
        res.render("master_detail.ejs", {
            error: error.message,
        })
    }
    await updateBookDetails();

});

app.post('/delete_book', async (req, res) => {
    const id = req.body.bookId;
    //console.log(`O ID DO LIVRO A APAGAR É: ${id}`);

    try{

        await deleteBook(id);

        res.redirect('/');

    } catch (error) {
        console.log(error);
    }


});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});