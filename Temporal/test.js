const neo4j = require('neo4j-driver')

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "secret"))


async function directorsMovies(dirName){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (d:Director {dirNombre: $dirNombre})-[:Dirigio]->(p:Pelicula) return p',
        {dirNombre: dirName}
    )

    await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    return nodes;
}

async function movieFilter(query){
    const nodes=[];
    const session = driver.session()
    
    const result = await session.run(
        'MATCH (a:Pelicula) WHERE a.titulo STARTS WITH $query RETURN a',
        { query: query }
    )
    await driver.close()
    
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    return nodes;
}


async function movieActors(movie){
    const nodes=[];
    const session = driver.session();
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:Actuo_en]-(a:Actor) return a',
        { movie: movie}
    )
    await driver.close()
    
    result.records.forEach(r =>{ nodes.push(r.get(0).properties.nombre)});

    return nodes;
}

async function movieRelations(movie){
    const nodes=[];
    const session = driver.session();
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[]-(x) return x',
        { movie: movie}
    )
    await driver.close()
    
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    return nodes;
}

async function actorsMovies(acName){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (a:Actor {nombre: $acNombre})-[:Actuo_en]->(p:Pelicula) return p',
        {acNombre: acName}
    )

    await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    return nodes;
}

async function userInfo(usuario){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (a:Usuario {username: $usr}) return a',
        {usr: usuario}
    )

    await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    return nodes;
}

async function createReview(usuario, review, score, movie){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (u:Usuario),(p:Pelicula) WHERE u.username = $usr AND p.titulo = $movie CREATE (u)-[r:CALIFICA { score: $score, review:$review}]->(p) RETURN type(r), r.name',
        {usr: usuario, movie: movie, score: score, review: review}
    )

    await driver.close()
    
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    return nodes;
}

async function userReviews(usuario){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula) return r, p',
        {usr: usuario}
    )

    await driver.close()
  
    result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

    return nodes;
}

async function movieReviews(movie){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (u:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return r, u.username',
        {movie: movie}
    )

    await driver.close()
  
    result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1)])});

    return nodes;
}

async function movieScoreAvg(movie){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
        {movie: movie}
    )

    await driver.close()
  
    result.records.forEach(r =>{ nodes.push(r.get(0))});

    return nodes;
}

async function registerUser(username, password, mail, genero, fecha){
    const nodes=[];
    const session = driver.session()
    const result = await session.run(
        'CREATE (:Usuario {username: $username, password:$password, mail:$mail, genero:$genero, fechaDeNacimiento:$fecha});',
        {username, password, mail, genero, fecha}
    )

    await driver.close()
  
    result.records.forEach(r =>{ nodes.push(r.get(0))});

    return nodes;
}

exports.directorsMovies = directorsMovies;
exports.movieFilter = movieFilter;
exports.movieActors = movieActors;
exports.movieRelations = movieRelations;
exports.actorsMovies = actorsMovies;
exports.userInfo = userInfo;
exports.createReview = createReview;
exports.userReviews = userReviews;
exports.movieReviews = movieReviews;
exports.movieScoreAvg = movieScoreAvg;
exports.registerUser = registerUser;