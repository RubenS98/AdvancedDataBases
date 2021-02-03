const neo4j = require('neo4j-driver')

const driver = neo4j.driver("bolt://neo4j:7687")
const session = driver.session()

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/directorsMovies/:dirName', async (req, res) => {
  try{
    const dirName = req.params.dirName;

    const nodes=[];
    
    const result = await session.run(
        'MATCH (d:Persona {nombre: $dirNombre})-[:DIRIGIO]->(p:Pelicula) return p',
        {dirNombre: dirName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieFilter/:query', async (req, res) => {
  try{
    const query = req.params.query;

    const nodes=[];
    const result = await session.run(
      'MATCH (a:Pelicula) WHERE a.titulo STARTS WITH $query RETURN a',
      { query: query }
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieActors/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:ACTUO_EN]-(a:Persona) return a',
          { movie: movie}
      )
    //await driver.close()
      
    result.records.forEach(r =>{ nodes.push([r.get(0).properties.nombre, r.get(0).properties.foto])});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieDirector/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:DIRIGIO]-(a:Persona) return a',
          { movie: movie}
      )
    //await driver.close()
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieRelations/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[]-(x) return x',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/actorsMovies/:actor', async (req, res) => {
  try{
    const acName = req.params.actor;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre})-[:ACTUO_EN]->(p:Pelicula) return p',
      {acNombre: acName}
    )

    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/actorInfo/:actor', async (req, res) => {
  try{
    const acName = req.params.actor;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre}) return a',
      {acNombre: acName}
    )

    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});


router.get('/userInfo/:user', async (req, res) => {
  try{
    const usuario = req.params.user;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (a:Usuario {username: $usr}) return a',
      {usr: usuario}
    )

    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/createReview/:usuario/:review/:score/:movie', async (req, res) => {
  try{
    const usuario = req.params.usuario;
    const review = req.params.review;
    const score = req.params.score;
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario),(p:Pelicula) WHERE u.username = $usr AND p.titulo = $movie CREATE (u)-[r:CALIFICA { score: toInteger($score), review:$review}]->(p) RETURN type(r), r.name',
          {usr: usuario, movie: movie, score: score, review: review}
      )
      //await driver.close()
      
      result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/userReviews/:usuario', async (req, res) => {
  try{  
    const usuario = req.params.usuario;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula) return r, p',
          {usr: usuario}
      )
      //await driver.close()
      
      result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

  res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/modifyReview/:usuario/:review/:score/:movie', async (req, res) => {
  try{  
    const usuario = req.params.usuario;
    const movie = req.params.movie;
    const review = req.params.review;
    const score = req.params.score;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) set r.review = $rev, r.score = toInteger($score)',
          {usr: usuario, mov: movie, rev: review, score: score}
      )
      //await driver.close()
      
      result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/deleteReview/:usuario/:movie', async (req, res) => {
  try{  
    const usuario = req.params.usuario;
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) delete r',
          {usr: usuario, mov: movie}
      )
      //await driver.close()
      
      result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});


router.get('/movieReviews/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return r, u.username',
      {movie: movie}
    )
    //await driver.close()

    result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1)])});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieScoreAvg/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0))});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
  });

router.get('/registerUser/:username/:password/:mail/:genero/:fecha', async (req, res) => {
  try{
      const username = req.params.username;
      const password = req.params.password;
      const mail = req.params.mail;
      const genero = req.params.genero;
      const fecha = req.params.fecha;

      const nodes=[];
      //const session = driver.session()
      const result = await session.run(
        'CREATE (:Usuario {username: $username, password:$password, mail:$mail, genero:$genero, fechaDeNacimiento:$fecha});',
            {username, password, mail, genero, fecha}
      )
      //await driver.close()

      result.records.forEach(r =>{ nodes.push(r.get(0))});

      res.send(nodes);
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});


module.exports = router;
