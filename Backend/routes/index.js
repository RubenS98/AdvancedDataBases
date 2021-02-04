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
router.get('/login/:username/:password', async (req,res)=>{
  try{
    const usuario = req.params.username;
    const password = req.params.password;

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

      res.send("Good");
    }
    else{
      res.send("Bad");
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
  
});

router.get('/sessionCheck', (req,res)=>{
  sess=req.session;
  console.log(sess.username);
  console.log(sess.fecha);
  console.log(sess.mail);

  res.send("Good");
});

router.get("/logout", async (req, res) => {
  try{
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.send("Good")
    });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/topMovies', async (req, res) => {
  try{
    appHelp.client.zrevrangebyscore('topmovies', 10, 0,'withscores', 'limit',0,5, function(err, reply) {
      res.send(reply);
    });

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/bottomMovies', async (req, res) => {
  try{
    appHelp.client.zrangebyscore('topmovies', 0, 10, 'withscores', 'limit', 0, 5, function(err, reply) {
      res.send(reply);
    });

  } catch (err) {
    console.log(err);
    res.send(err);
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
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:ACTUO_EN]-(a:Persona) return a',
          { movie: movie}
      )
      
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

    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:DIRIGIO]-(a:Persona) return a',
          { movie: movie}
      )
      
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
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre})-[:ACTUO_EN]->(p:Pelicula) return p',
      {acNombre: acName}
    )

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

    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre}) return a',
      {acNombre: acName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
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
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula) return r, p',
          {usr: usuario}
      )
      
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
    
    const result = await session.run(
      'MATCH (u:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return r, u.username',
      {movie: movie}
    )

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
    const result = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )

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

      const result = await session.run(
        'CREATE (:Usuario {username: $username, password:$password, mail:$mail, genero:$genero, fechaDeNacimiento:$fecha});',
            {username, password, mail, genero, fecha}
      )

      result.records.forEach(r =>{ nodes.push(r.get(0))});

      res.send(nodes);
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});


router.get('/editUser/:username/:password/:mail/:genero/:fecha', async (req, res) => {
  try{
      const username = req.params.username;
      const password = req.params.password;
      const mail = req.params.mail;
      const genero = req.params.genero;
      const fecha = req.params.fecha;

      const nodes=[];

      const result = await session.run(
        'match (n:Usuario {username: $username}) SET n.password=$password, n.genero=$genero, n.fechaDeNacimiento=$fecha, n.mail=$mail;',
            {username, password, mail, genero, fecha}
      )

      sess=req.session;
      sess.username=username;
      sess.password=password;
      sess.mail=mail;
      sess.fecha=fecha;
      sess.genero=genero;

      result.records.forEach(r =>{ nodes.push(r.get(0))});

      res.send(nodes);
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});


module.exports = router;
