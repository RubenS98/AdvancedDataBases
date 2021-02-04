const neo4j = require('neo4j-driver')

const driver = neo4j.driver("bolt://neo4j:7687")
const session = driver.session()

const express = require('express');
const router = express.Router();

const appHelp = require('../app')

/**
 * Query the clothes database with input parameters and
 * return the result of the query.
 *
 * @param {string} stdSize Standard size of the input avatar.
 * @param {string} gender Gender of the input avatar.
 * @param {string} category Category (tops, bottoms, shoes) the user wants to see.
 * @return {array} Result of the query.
 */
router.post('/login', async (req,res)=>{
  try{
    const usuario = req.body.username;
    const password = req.body.password;

    const nodes=[];
    const result = await session.run(
      'MATCH (a:Usuario {username: $usr}) return a',
      {usr: usuario}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});
    
    if(nodes.length > 0 && nodes[0].password==password){
      sess=req.session;
      sess.username=req.params.username;
      sess.password=password;
      sess.mail=nodes[0].mail;
      sess.fecha=nodes[0].fechaDeNacimiento;
      sess.genero=nodes[0].genero;

      res.sendStatus(200);
    }
    else{
      res.status(400).send("Login failed");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
  
});

router.get('/sessionCheck', (req,res)=>{
  sess=req.session;
  console.log(sess.username);
  console.log(sess.fecha);
  console.log(sess.mail);

  res.sendStatus(200);
});

router.get("/logout", async (req, res) => {
  try{
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.sendStatus(200);
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/topMovies', async (req, res) => {
  const nodes=[];
  let size;
  try{
    appHelp.client.zrevrangebyscore('topmovies', 10, 0,'withscores', 'limit',0,5, function(err, reply) {
      size=reply.length;
      console.log(size);
      for (let i=0; i<size; i+=2){
        nodes.push({"titulo": reply[i], "score": reply[i+1]});
      }
      res.send(nodes);
    });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/bottomMovies', async (req, res) => {
  const nodes=[];
  let size;

  try{
    appHelp.client.zrangebyscore('topmovies', 0, 10, 'withscores', 'limit', 0, 5, function(err, reply) {
      size=reply.length;
      for (let i=0; i<size; i+=2){
        nodes.push({"titulo": reply[i], "score": reply[i+1]});
      }
      res.send(nodes);
    });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
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
    res.status(500).send(err);
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
    res.status(500).send(err);
  }
});

router.get('/movieActors/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:ACTUO_EN]-(a:Persona) return a',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push([r.get(0).properties.nombre, r.get(0).properties.foto])});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/movieDirector/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];

    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:DIRIGIO]-(a:Persona) return a',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
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
    res.status(500).send(err);
  }
});

router.get('/actorsMovies/:actor', async (req, res) => {
  try{
    const acName = req.params.actor;

    const nodes=[];
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre})-[:ACTUO_EN]->(p:Pelicula) return p',
      {acNombre: acName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/actorInfo/:actor', async (req, res) => {
  try{
    const acName = req.params.actor;

    const nodes=[];

    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre}) return a',
      {acNombre: acName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});


router.get('/userInfo', async (req, res) => {
  try{
    const nodes=[];

    sess=req.session;

    nodes.push({"username":sess.username}, {"password":sess.password}, {"fecha":sess.fecha}, {"mail":sess.mail}, {"genero":sess.genero});
    
    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post('/createReview', async (req, res) => {
  try{
    sess=req.session;
    const usuario = sess.username;
    const review = req.body.review;
    const score = req.body.score;
    const movie = req.body.movie;

    const nodes=[];
    
    const result = await session.run(
      'MATCH (u:Usuario),(p:Pelicula) WHERE u.username = $usr AND p.titulo = $movie CREATE (u)-[r:CALIFICA { score: toInteger($score), review:$review}]->(p) RETURN type(r), r.name',
          {usr: usuario, movie: movie, score: score, review: review}
      )
      
      
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
    
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});

    appHelp.client.zadd('topmovies', nodes[0], movie, function(err, reply) {
      console.log(err);
    });

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/userReviews', async (req, res) => {
  try{
    sess=req.session;
    const usuario = sess.username;

    const nodes=[];
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula) return r, p',
          {usr: usuario}
      )
      
      result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

  res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post('/modifyReview', async (req, res) => {
  try{ 
    sess=req.session;
    const usuario = sess.username;
    const movie = req.body.movie;
    const review = req.body.review;
    const score = req.body.score;

    const nodes=[];
    
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) set r.review = $rev, r.score = toInteger($score)',
          {usr: usuario, mov: movie, rev: review, score: score}
      )
    
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});

    appHelp.client.zadd('topmovies', nodes[0], movie, function(err, reply) {
      console.log(err);
    });

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post('/deleteReview', async (req, res) => {
  try{
    sess=req.session;
    const usuario = sess.username;
    const movie = req.body.movie;

    const nodes=[];
    
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) delete r',
          {usr: usuario, mov: movie}
      )
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});
    
    if(nodes[0]==null){
      appHelp.client.zrem('topmovies', movie, function(err, reply) {
        console.log(err);
      });
    }
    else{
      appHelp.client.zadd('topmovies', nodes[0], movie, function(err, reply) {
        console.log(err);
      });
    }
  
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});


router.get('/movieReviews/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    
    const result = await session.run(
      'MATCH (u:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return r, u.username',
      {movie: movie}
    )

    result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1)])});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/movieScoreAvg/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    const result = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0))});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
  });

  /**
 * Registro de un nuevo usuario. Inserta la información del nuevo usuario.
 *
 * @param {string} username Nombre de nuevo usuario.
 * @param {string} password Contraseña del nuevo usuario.
 * @param {string} mail Email del nuevo usuario.
 * @param {string} genero Genero del nuevo usuario.
 * @return {bool} Regresa true si la acción se completó exitosamente o error si hubo algún problema.
 */
router.post('/registerUser', async (req, res) => {
  try{
      const username = req.body.username;
      const password = req.body.password;
      const mail = req.body.mail;
      const genero = req.body.genero;
      const fecha = req.body.fecha;

      const result = await session.run(
        'CREATE (:Usuario {username: $username, password:$password, mail:$mail, genero:$genero, fechaDeNacimiento:$fecha});',
            {username, password, mail, genero, fecha}
      )

      res.sendStatus(200);
  } catch (err) {
      console.log(err);
      res.status(500).send(err);
  }
});


/**
 * Edición de un ususario. Actualiza la información del usuario en Neo4J y la información de la sesión en Redis
 *
 * @param {string} username Nombre de usuario actualizado.
 * @param {string} password Contraseña actualizada del usuario.
 * @param {string} mail Email actualizado del usuario.
 * @param {string} genero Genero actualizado del usuario.
 * @return {Status} Regresa true si la acción se completó exitosamente o el error si hubo algún problema
 */
router.post('/editUser', async (req, res) => {
  try{
      sess=req.session;
      const username = sess.username;
      const mail = req.body.mail;
      const genero = req.body.genero;
      const fecha = req.body.fecha;

      const result = await session.run(
        'match (n:Usuario {username: $username}) SET n.genero=$genero, n.fechaDeNacimiento=$fecha, n.mail=$mail;',
            {username, password, mail, genero, fecha}
      )

      sess.mail=mail;
      sess.fecha=fecha;
      sess.genero=genero;

      res.sendStatus(200)
  } catch (err) {
      console.log(err);
      res.status(500).send(err);
  }
});


module.exports = router;
