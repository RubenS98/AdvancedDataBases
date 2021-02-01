const api = require('./test');
const dirName = "Christopher Nolan"
const query = "Mat"
const movie = "Matrix"
const actor="Brad Pitt"

//api.directorsMovies(dirName);
const getResult = async () =>{
    console.log(await api.directorsMovies(dirName));
}
const getResult2 = async () =>{
    console.log(await api.movieFilter(query));
}
const getResult3 = async () =>{
    console.log(await api.movieRelations(movie));
}
const getResult4 = async () =>{
    console.log(await api.actorsMovies(actor));
}
const getResult5 = async () =>{
    console.log(await api.userInfo("RubenS"));
}
const getResult6 = async () =>{
    console.log(await api.createReview("sabrisantana5", "Pelicula bien chida.", 10, "10 Things I Hate About You"));
}
const getResult7 = async () =>{
    console.log(await api.userReviews("RubenS"));
}
const getResult8 = async () =>{
    console.log(await api.movieReviews("Mirror Mirror"));
}
const getResult9 = async () =>{
    console.log(await api.movieScoreAvg("10 Things I Hate About You"));
}
const getResult10 = async () =>{
    console.log(await api.registerUser("irdemineit", "secret", "irdemineit@gmail.com", "M", "13-12-1998"));
}

getResult10()